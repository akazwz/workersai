import {
	VStack,
	HStack,
	Textarea,
	Spacer,
	IconButton,
	Icon,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import { chatClient } from "~/connect";
import { RiArrowUpLine, RiMicLine, RiRecordCircleLine } from "react-icons/ri";
import { WebSocketClient } from "~/lib/websocket";
import { useChatStore } from "~/stores/chat";
import {
	addQueryConversation,
	addQueryMessage,
	updateConversationUpdatedAt,
} from "~/utils/query";
import { toaster } from "~/components/ui/toaster";
import { stripProtoMetadata } from "~/types";

export function ChatInput() {
	const [isComposing, setIsComposing] = useState(false);
	const [content, setContent] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);

	const webSocket = WebSocketClient.getInstance();
	const { conversationId, setConversationId, setIsStreaming } = useChatStore();

	const createConversationMutation = useMutation({
		mutationFn: async () => {
			const response = await chatClient.createConversation({});
			return stripProtoMetadata(response.conversation);
		},
		onSettled(data, error, variables, context) {
			if (data) {
				setConversationId(data.id);
				addQueryConversation(data);
			}
		},
	});

	const speechToTextMutation = useMutation({
		mutationFn: async (audio: Uint8Array) => {
			const response = await chatClient.speechToText({
				audio,
			});
			return response.text;
		},
		onSettled(data, error, variables, context) {
			if (data) {
				setContent((prev) => prev + data);
			}
			if (error) {
				toaster.error({
					title: "Speech Recognition Error",
					description: "An error occurred during speech recognition.",
				});
			}
		},
	});

	async function handleSendMessage() {
		if (content.trim() === "") return;
		let convId = conversationId;
		if (!convId) {
			const conversation = await createConversationMutation.mutateAsync();
			if (conversation) {
				convId = conversation.id;
			}
		}
		if (!convId) return;
		updateConversationUpdatedAt(convId);
		setIsStreaming(true);
		const id = crypto.randomUUID();
		addQueryMessage({
			id,
			conversationId: convId,
			role: "user",
			content,
			createdAt: new Date().toISOString(),
		});
		webSocket.send({
			type: "chat.stream.create",
			eventId: id,
			conversationId: convId,
			content,
			model: useChatStore.getState().model,
			tools: [],
		});
		setContent("");
	}

	async function handleMicClick() {
		if (isRecording) {
			if (mediaRecorderRef.current) {
				mediaRecorderRef.current.stop();
			}
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const recorder = new MediaRecorder(stream);
				mediaRecorderRef.current = recorder;
				audioChunksRef.current = [];

				recorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						audioChunksRef.current.push(event.data);
					}
				};

				recorder.onstop = async () => {
					const audioBlob = new Blob(audioChunksRef.current, {
						type: "audio/webm",
					});
					const audioBuffer = await audioBlob.arrayBuffer();
					const audioUint8Array = new Uint8Array(audioBuffer);

					stream.getTracks().forEach((track) => track.stop());
					setIsRecording(false);

					if (audioUint8Array.length === 0) {
						console.log("No audio recorded");
						return;
					}
					speechToTextMutation.mutateAsync(audioUint8Array);
				};
				recorder.start();
				setIsRecording(true);
			} catch (error) {
				console.error("Error accessing microphone:", error);
				toaster.error({
					title: "Microphone Access Denied",
					description:
						"Please allow microphone access in your browser settings.",
				});
				setIsRecording(false);
			}
		}
	}

	return (
		<HStack w="full" p={2}>
			<VStack
				w="full"
				rounded="2xl"
				borderWidth={1}
				p={1}
				gap={0}
				maxW="3xl"
				mx="auto"
			>
				<HStack w="full">
					<Textarea
						id="chat-input"
						spellCheck={false}
						placeholder="Type a message, press enter to send"
						value={content}
						resize="none"
						autoFocus
						border="none"
						focusRingWidth={0}
						onChange={(e) => setContent(e.target.value)}
						onCompositionStart={() => setIsComposing(true)}
						onCompositionEnd={() => setIsComposing(false)}
						onKeyDown={(e) => {
							if (
								e.key === "Enter" &&
								!e.shiftKey &&
								!isComposing &&
								content.trim() !== ""
							) {
								e.preventDefault();
								handleSendMessage();
							}
						}}
					/>
				</HStack>
				<HStack w="full" px={1}>
					<IconButton
						size="xs"
						rounded="full"
						variant="ghost"
						onClick={handleMicClick}
						colorPalette={isRecording ? "red" : "gray"}
						loading={speechToTextMutation.isPending}
						aria-label={isRecording ? "Stop Recording" : "Start Recording"}
					>
						<Icon
							as={isRecording ? RiRecordCircleLine : RiMicLine}
							size="sm"
							flexShrink={0}
						/>
					</IconButton>
					<Spacer />
					<IconButton
						onClick={handleSendMessage}
						disabled={content.trim() === ""}
						size="xs"
						rounded="full"
					>
						<Icon as={RiArrowUpLine} size="sm" flexShrink={0} />
					</IconButton>
				</HStack>
			</VStack>
		</HStack>
	);
}
