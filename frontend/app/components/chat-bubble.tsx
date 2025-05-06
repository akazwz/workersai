import {
	Box,
	HStack,
	Icon,
	IconButton,
	VStack,
	Clipboard,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import {
	RiVolumeMuteLine,
	RiVolumeUpLine,
	RiRefreshLine,
} from "react-icons/ri";
import ReactMarkdown from "react-markdown";

import { Prose } from "~/components/ui/prose";
import { chatClient } from "~/connect";
import { WebSocketClient } from "~/lib/websocket";
import { useChatStore } from "~/stores/chat";
import type { Message } from "~/types";
import { removeQueryMessage, updateConversationUpdatedAt } from "~/utils/query";

interface ChatBubbleProps {
	message: Message;
	lastAssistantMessageId?: string;
}

export function StreamBubble() {
	return (
		<HStack w="full" maxW="3xl" mx="auto" p={2}>
			<Box
				animation="pulse 2s linear infinite"
				boxSize={4}
				rounded="full"
				bg="bg.inverted"
				display="inline-block"
				verticalAlign="middle"
				mx={2}
			/>
		</HStack>
	);
}

export function StreamContentBubble({
	streamContent,
}: {
	streamContent: string;
}) {
	return (
		<HStack w="full" maxW="3xl" mx="auto">
			<Prose rounded="2xl" p={2} px={3}>
				<ReactMarkdown
					components={{
						p: "span",
					}}
				>
					{streamContent}
				</ReactMarkdown>
				<Box
					animation="pulse 2s linear infinite"
					boxSize={4}
					rounded="full"
					bg="bg.inverted"
					display="inline-block"
					verticalAlign="middle"
					mx={2}
				/>
			</Prose>
		</HStack>
	);
}

export function ChatBubble({
	message,
	lastAssistantMessageId,
}: ChatBubbleProps) {
	switch (message.role) {
		case "user":
			return <UserBubble message={message} />;
		case "assistant":
			return (
				<RobotBubble
					message={message}
					lastAssistantMessageId={lastAssistantMessageId}
				/>
			);
	}
}

export function UserBubble({ message }: ChatBubbleProps) {
	return (
		<HStack w="full" flexDir="row-reverse" maxW="3xl" mx="auto">
			<Prose bg="bg.muted" rounded="2xl" p={2} px={3} roundedBottomRight={0}>
				<ReactMarkdown>{message.content}</ReactMarkdown>
			</Prose>
		</HStack>
	);
}

export function RobotBubble({
	message,
	lastAssistantMessageId,
}: ChatBubbleProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const isPlayingRef = useRef(false);

	const { model, isStreaming, setIsStreaming } = useChatStore();

	async function playAudio() {
		if (isPlayingRef.current) {
			stopAudio();
			return;
		}
		setIsPlaying(true);
		isPlayingRef.current = true;
		try {
			const stream = chatClient.streamTTS({
				text: message.content,
			});
			for await (const chunk of stream) {
				if (!isPlayingRef.current) {
					console.log("Playback stopped externally (ref check).");
					break;
				}
				const audio = new Audio();
				audioRef.current = audio;
				const audioSrc = URL.createObjectURL(new Blob([chunk.audio]));
				audio.src = audioSrc;
				audio.play();
				await new Promise((resolve) => (audio.onended = resolve));
				URL.revokeObjectURL(audioSrc);
				audioRef.current = null;
				await new Promise((res) => setTimeout(res, 50));
			}
		} catch (error) {
			console.error("Error during TTS playback:", error);
		} finally {
			isPlayingRef.current = false;
			setIsPlaying(false);
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.src = "";
				audioRef.current = null;
			}
		}
	}

	function stopAudio() {
		console.log("Stopping audio playback.");
		isPlayingRef.current = false;
		setIsPlaying(false);
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.src = "";
			audioRef.current = null;
		}
	}

	function regenerate() {
		removeQueryMessage(message);
		updateConversationUpdatedAt(message.conversationId);
		setIsStreaming(true);
		WebSocketClient.getInstance().send({
			type: "chat.regenerate",
			eventId: message.id,
			conversationId: message.conversationId,
			model,
		});
	}

	useEffect(() => {
		return () => {
			stopAudio();
		};
	}, []);

	return (
		<HStack w="full" maxW="3xl" mx="auto">
			<VStack w="full" gap={0} alignItems="flex-start">
				<Prose rounded="2xl" p={2} px={3}>
					<ReactMarkdown
						components={{
							p: "span",
						}}
					>
						{message.content}
					</ReactMarkdown>
				</Prose>
				<HStack px={3} gap={0.5}>
					<IconButton
						variant="ghost"
						size="xs"
						color="fg.muted"
						onClick={playAudio}
					>
						<Icon as={isPlaying ? RiVolumeMuteLine : RiVolumeUpLine} />
					</IconButton>
					<Clipboard.Root value={message.content}>
						<Clipboard.Trigger asChild>
							<IconButton variant="ghost" size="xs" color="fg.muted">
								<Clipboard.Indicator />
							</IconButton>
						</Clipboard.Trigger>
					</Clipboard.Root>
					<IconButton
						variant="ghost"
						size="xs"
						color="fg.muted"
						onClick={regenerate}
						hidden={message.id !== lastAssistantMessageId || isStreaming}
					>
						<Icon as={RiRefreshLine} />
					</IconButton>
				</HStack>
			</VStack>
		</HStack>
	);
}
