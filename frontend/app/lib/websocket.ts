import type { ChatCompletionTool } from "openai/resources/chat/completions";

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

// Type alias for server message types
type ServerMessageType = WebSocketServerMessage["type"];

export class WebSocketClient {
	private static instance: WebSocketClient | null = null;
	private socket: WebSocket;
	private eventListeners: Map<string, Set<(data: any) => void>> = new Map(); // Store custom listeners

	private constructor(url: string) {
		this.socket = new WebSocket(url);

		// Handle native WebSocket events and re-emit them using our system
		this.socket.addEventListener("open", () => this._emit("open", undefined));
		this.socket.addEventListener("close", () => this._emit("close", undefined));
		this.socket.addEventListener("error", (event) =>
			this._emit("error", event),
		);

		// Handle incoming messages
		this.socket.addEventListener("message", (event) => {
			try {
				const message = JSON.parse(event.data) as WebSocketServerMessage;
				if (message && message.type) {
					// Emit event based on message type
					this._emit(message.type, message);
				} else {
					console.warn("Received message without type:", event.data);
					// Optionally emit a generic 'message' event for non-typed messages
					// this._emit('message', event.data);
				}
			} catch (e) {
				console.error("Failed to parse WebSocket message:", e);
				// Optionally emit an error or a generic message event
				// this._emit('error', e);
				// this._emit('message', event.data); // Emit raw data on parse error
			}
		});
	}

	public static initialize(url: string): void {
		if (WebSocketClient.instance) {
			console.warn(
				"WebSocketClient already initialized. Ignoring subsequent initialize call.",
			);
			return;
		}
		if (!url) {
			throw new Error("WebSocket URL must be provided during initialization.");
		}
		WebSocketClient.instance = new WebSocketClient(url);
	}

	public static getInstance(): WebSocketClient {
		if (!WebSocketClient.instance) {
			throw new Error(
				"WebSocketClient not initialized. Call WebSocketClient.initialize(url) first.",
			);
		}
		return WebSocketClient.instance;
	}

	// Register listeners using generics for server messages and overloads for native events
	public on<K extends ServerMessageType>(
		eventType: K,
		callback: (data: Extract<WebSocketServerMessage, { type: K }>) => void,
	): void;
	public on(eventType: "open", callback: () => void): void;
	public on(eventType: "close", callback: () => void): void;
	public on(eventType: "error", callback: (error: Event) => void): void;
	// Implementation signature remains the same
	public on(eventType: string, callback: (data: any) => void): void {
		if (!this.eventListeners.has(eventType)) {
			this.eventListeners.set(eventType, new Set());
		}
		this.eventListeners.get(eventType)?.add(callback);
	}

	// Remove listeners using generics for server messages and overloads for native events
	public off<K extends ServerMessageType>(
		eventType: K,
		callback: (data: Extract<WebSocketServerMessage, { type: K }>) => void,
	): void;
	public off(eventType: "open", callback: () => void): void;
	public off(eventType: "close", callback: () => void): void;
	public off(eventType: "error", callback: (error: Event) => void): void;
	// Implementation signature remains the same
	public off(eventType: string, callback: (data: any) => void): void {
		const listeners = this.eventListeners.get(eventType);
		if (listeners) {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this.eventListeners.delete(eventType);
			}
		}
	}

	// Internal method to emit events
	private _emit(eventType: string, data: any): void {
		const listeners = this.eventListeners.get(eventType);
		if (listeners) {
			listeners.forEach((callback) => {
				try {
					callback(data);
				} catch (e) {
					console.error(
						`Error in WebSocket event listener for ${eventType}:`,
						e,
					);
				}
			});
		}
	}

	public send(data: WebSocketClientMessage) {
		this.socket.send(JSON.stringify(data));
	}
}
