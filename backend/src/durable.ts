import { DurableObject } from "cloudflare:workers";
import {
	drizzle,
	type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { OpenAI } from "openai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const ConversationTitleExtraction = z.object({
	title: z.string(),
});

import migrations from "drizzle/migrations";
import * as schema from "drizzle/schema";

export type WebSocketChatStreamCreateMessage = {
	type: "chat.stream.create";
	eventId: string;
	conversationId: string;
	content: string;
	model: string;
	tools: Array<ChatCompletionTool>;
};

export type WebSocketChatStreamCancelMessage = {
	type: "chat.stream.cancel";
	eventId: string;
	conversationId: string;
};

export type WebSocketChatRegenerateMessage = {
	type: "chat.regenerate";
	eventId: string;
	conversationId: string;
	model: string;
	tools: Array<ChatCompletionTool>;
};

export type WebSocketStreamMessage = {
	type: "chat.stream.response";
	eventId: string;
	conversationId: string;
	content: string;
};

export type WebSocketStreamDoneMessage = {
	type: "chat.stream.done";
	eventId: string;
	conversationId: string;
	function_call: {
		name: string;
		arguments: string;
	} | null;
};

export type WebSocketConversationTitleMessage = {
	type: "conversation.title.update";
	eventId: string;
	conversationId: string;
	title: string;
};

export type WebSocketClientMessage =
	| WebSocketChatStreamCreateMessage
	| WebSocketChatStreamCancelMessage
	| WebSocketConversationTitleMessage
	| WebSocketChatRegenerateMessage;

export type WebSocketServerMessage =
	| WebSocketStreamMessage
	| WebSocketStreamDoneMessage
	| WebSocketConversationTitleMessage;

export class WorkersAIDurableObject extends DurableObject<Env> {
	db: DrizzleSqliteDODatabase<typeof schema>;
	workersAI: OpenAI;
	abortController: AbortController;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.db = drizzle(ctx.storage, { schema, casing: "snake_case" });
		this.workersAI = new OpenAI({
			baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_AI_GATEWAY_ID}/workers-ai/v1`,
			apiKey: env.CLOUDFLARE_WORKERS_AI_TOKEN,
			defaultHeaders: {
				"cf-aig-authorization": `Bearer ${env.CLOUDFLARE_AI_GATEWAY_TOKEN}`,
			},
		});
		this.abortController = new AbortController();
		ctx.blockConcurrencyWhile(async () => {
			try {
				await migrate(this.db, migrations);
			} catch (error) {
				console.error(error);
				await migrate(this.db, migrations);
			}
		});
	}

	async fetch(request: Request): Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);
		this.ctx.acceptWebSocket(server);
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(
		ws: WebSocket,
		message: string | ArrayBuffer,
	): Promise<void> {
		const parsedMessage = JSON.parse(
			message as string,
		) as WebSocketClientMessage;
		switch (parsedMessage.type) {
			case "chat.stream.create":
				await this.handleChat(ws, parsedMessage);
				break;
			case "chat.stream.cancel":
				this.abortController.abort();
				break;
			case "chat.regenerate":
				await this.handleRegenerate(ws, parsedMessage);
				break;
		}
	}

	// workers ai doesn't support openai entrypoint tools
	private async handleChat(
		ws: WebSocket,
		parsedMessage: WebSocketChatStreamCreateMessage,
	) {
		const { eventId, content, conversationId } = parsedMessage;
		this.abortController = new AbortController();
		try {
			const conversation = await this.db.query.conversations.findFirst({
				where(fields, operators) {
					return operators.eq(fields.id, conversationId);
				},
			});
			if (!conversation) {
				throw new Error(`Conversation not found: ${conversationId}`);
			}
			await this.db.insert(schema.messages).values({
				user_id: "1",
				conversation_id: conversationId,
				role: "user",
				content,
			});
			const messages = await this.db.query.messages.findMany({
				columns: {
					role: true,
					content: true,
				},
				where(fields, operators) {
					return operators.eq(fields.conversation_id, conversationId);
				},
				orderBy(fields, operators) {
					return operators.asc(fields.created_at);
				},
			});
			const stream = await this.workersAI.chat.completions.create(
				{
					model: parsedMessage.model,
					messages,
					reasoning_effort: "low",
					stream: true,
					store: true,
					max_completion_tokens: 10000,
				},
				{
					signal: this.abortController.signal,
				},
			);
			let response = "";
			try {
				const toolCallMap = new Map<
					number,
					OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall
				>();
				for await (const chunk of stream) {
					const delta = chunk.choices[0].delta;
					console.log(delta);
					let chunkContent = delta.content;
					if (chunkContent) {
						response += chunkContent;
						const streamMessage: WebSocketStreamMessage = {
							type: "chat.stream.response",
							eventId,
							conversationId,
							content: chunkContent,
						};
						ws.send(JSON.stringify(streamMessage));
					}
					for (const toolCall of delta.tool_calls ?? []) {
						const existingToolCall = toolCallMap.get(toolCall.index);
						if (existingToolCall) {
							if (toolCall.function?.name) {
								existingToolCall.function = existingToolCall.function || {};
								existingToolCall.function.name = toolCall.function.name;
							}
							if (toolCall.function?.arguments) {
								existingToolCall.function = existingToolCall.function || {};
								existingToolCall.function.arguments =
									(existingToolCall.function.arguments || "") +
									toolCall.function.arguments;
							}
							if (toolCall.id) {
								existingToolCall.id = toolCall.id;
							}
							if (toolCall.type) {
								existingToolCall.type = toolCall.type;
							}
						} else {
							toolCallMap.set(toolCall.index, {
								index: toolCall.index,
								id: toolCall.id,
								type: toolCall.type,
								function: {
									name: toolCall.function?.name,
									arguments: toolCall.function?.arguments || "",
								},
							});
						}
					}
					if (toolCallMap.size > 0) {
						const toolCall = Array.from(toolCallMap.values())[0];
						const name = toolCall?.function?.name;
						if (name) {
							const doneMessage: WebSocketStreamDoneMessage = {
								type: "chat.stream.done",
								eventId,
								conversationId,
								function_call: {
									name,
									arguments: toolCall?.function?.arguments || "",
								},
							};
							ws.send(JSON.stringify(doneMessage));
						}
					}
				}
			} catch (error: unknown) {
				if (error instanceof Error && error.name === "AbortError") {
					console.log(`Stream aborted for conversation ${conversationId}`);
				} else {
					console.error(
						`Error processing stream for conversation ${conversationId}:`,
						error,
					);
					throw error;
				}
			}
			const doneMessage: WebSocketStreamDoneMessage = {
				type: "chat.stream.done",
				eventId,
				conversationId,
				function_call: null,
			};
			ws.send(JSON.stringify(doneMessage));
			await this.db.insert(schema.messages).values({
				user_id: "1",
				conversation_id: conversationId,
				role: "assistant",
				content: response,
			});
			await this.db
				.update(schema.conversations)
				.set({
					updated_at: new Date().toISOString(),
				})
				.where(eq(schema.conversations.id, conversationId));
			if (conversation.title === null) {
				const messagesForTitle = [
					...messages,
					{ role: "assistant" as const, content: response },
				];
				try {
					const completion = await this.workersAI.chat.completions.create({
						model: "@cf/meta/llama-4-scout-17b-16e-instruct",
						messages: [
							{
								role: "system",
								content:
									'You are a conversation title generator. Generate a concise, relevant title (max 1-2 sentences) for the following conversation, returning JSON like {"title": "Your Generated Title"}. Match the conversation\'s language.',
							},
							...messagesForTitle,
						],
						response_format: zodResponseFormat(
							ConversationTitleExtraction,
							"conversation_title",
						),
						max_completion_tokens: 50,
					});
					const titleResponse = completion.choices[0].message;
					const parsedTitle = ConversationTitleExtraction.parse(
						JSON.parse(titleResponse.content || "{}"),
					);
					if (parsedTitle.title) {
						await this.db
							.update(schema.conversations)
							.set({ title: parsedTitle.title })
							.where(eq(schema.conversations.id, conversationId));
						const titleMessage: WebSocketConversationTitleMessage = {
							type: "conversation.title.update",
							eventId,
							conversationId: conversationId,
							title: parsedTitle.title,
						};
						ws.send(JSON.stringify(titleMessage));
					} else {
						console.warn(
							`Generated empty title for conversation ${conversationId}`,
						);
					}
				} catch (titleError) {
					console.error(
						`Failed to generate or parse title for conversation ${conversationId}:`,
						titleError,
					);
				}
			}
		} catch (error) {
			console.error(
				`Error in handleChat for conversation ${conversationId}:`,
				error,
			);
			try {
				ws.send(
					JSON.stringify({
						type: "error",
						eventId,
						message: "An internal error occurred",
					}),
				);
			} catch (wsError) {
				console.error(
					`Failed to send error message via WebSocket for conversation ${conversationId}:`,
					wsError,
				);
			}
		}
	}

	private async handleRegenerate(
		ws: WebSocket,
		parsedMessage: WebSocketChatRegenerateMessage,
	) {
		const { eventId, conversationId } = parsedMessage;
		this.abortController = new AbortController();

		try {
			const allMessages = await this.db.query.messages.findMany({
				columns: {
					id: true,
					role: true,
					content: true,
				},
				where(fields, operators) {
					return operators.eq(fields.conversation_id, conversationId);
				},
				orderBy(fields, operators) {
					return operators.asc(fields.created_at);
				},
			});

			if (
				allMessages.length < 2 ||
				allMessages[allMessages.length - 1].role !== "assistant"
			) {
				console.warn(
					`Cannot regenerate for conversation ${conversationId}: No preceding assistant message found or history too short.`,
				);
				ws.send(
					JSON.stringify({
						type: "error",
						eventId,
						message: "Cannot regenerate the last message.",
					}),
				);
				return;
			}

			const lastAssistantMessage = allMessages.pop()!;
			const lastAssistantMessageId = lastAssistantMessage.id;
			const messagesForRegeneration = allMessages.map(({ role, content }) => ({
				role: role as "user" | "assistant",
				content,
			}));

			const stream = await this.workersAI.chat.completions.create(
				{
					model: parsedMessage.model,
					messages: messagesForRegeneration,
					stream: true,
					max_completion_tokens: 10000,
					reasoning_effort: "low",
					store: true,
				},
				{
					signal: this.abortController.signal,
					headers: {
						"cf-aig-skip-cache": "true",
					},
				},
			);

			let newResponse = "";
			try {
				for await (const chunk of stream) {
					let chunkContent = chunk.choices?.[0]?.delta?.content;
					if (chunkContent) {
						newResponse += chunkContent;
						const streamMessage: WebSocketStreamMessage = {
							type: "chat.stream.response",
							eventId,
							conversationId,
							content: chunkContent,
						};
						ws.send(JSON.stringify(streamMessage));
					}
				}
			} catch (error: unknown) {
				if (error instanceof Error && error.name === "AbortError") {
					console.log(
						`Regeneration stream aborted for conversation ${conversationId}`,
					);
					return;
				} else {
					console.error(
						`Error processing regeneration stream for conversation ${conversationId}:`,
						error,
					);
					throw error;
				}
			}

			const doneMessage: WebSocketStreamDoneMessage = {
				type: "chat.stream.done",
				eventId,
				conversationId,
				function_call: null,
			};
			ws.send(JSON.stringify(doneMessage));

			await this.db
				.update(schema.messages)
				.set({
					content: newResponse,
				})
				.where(eq(schema.messages.id, lastAssistantMessageId));

			await this.db
				.update(schema.conversations)
				.set({ updated_at: new Date().toISOString() })
				.where(eq(schema.conversations.id, conversationId));
		} catch (error) {
			console.error(
				`Error in handleRegenerate for conversation ${conversationId}:`,
				error,
			);
			try {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(
						JSON.stringify({
							type: "error",
							eventId,
							message: "An internal error occurred during regeneration.",
						}),
					);
				}
			} catch (wsError) {
				console.error(
					`Failed to send error message via WebSocket for regeneration on conversation ${conversationId}:`,
					wsError,
				);
			}
		}
	}

	async listConversations() {
		return await this.db.query.conversations.findMany({
			orderBy(fields, operators) {
				return [
					operators.desc(fields.pinned),
					operators.desc(fields.updated_at),
				];
			},
		});
	}

	async createConversation() {
		const [conversation] = await this.db
			.insert(schema.conversations)
			.values({
				user_id: "1",
			})
			.returning();
		return conversation;
	}

	async deleteConversation(conversationId: string) {
		await this.db
			.delete(schema.conversations)
			.where(eq(schema.conversations.id, conversationId));
		await this.db
			.delete(schema.messages)
			.where(eq(schema.messages.conversation_id, conversationId));
	}

	async renameConversation(conversationId: string, title: string) {
		await this.db
			.update(schema.conversations)
			.set({ title })
			.where(eq(schema.conversations.id, conversationId));
	}

	async pinConversation(conversationId: string) {
		await this.db
			.update(schema.conversations)
			.set({ pinned: true })
			.where(eq(schema.conversations.id, conversationId));
	}

	async unpinConversation(conversationId: string) {
		await this.db
			.update(schema.conversations)
			.set({ pinned: false })
			.where(eq(schema.conversations.id, conversationId));
	}

	async listMessages({
		conversationId,
	}: {
		conversationId: string;
	}) {
		return await this.db.query.messages.findMany({
			where(fields, operators) {
				return operators.eq(fields.conversation_id, conversationId);
			},
			orderBy(fields, operators) {
				return operators.asc(fields.created_at);
			},
		});
	}
}
