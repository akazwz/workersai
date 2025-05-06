import {
	Center,
	Heading,
	HStack,
	Icon,
	IconButton,
	Spacer,
	Spinner,
	VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { RiAddLine } from "react-icons/ri";
import {
	ChatBubble,
	StreamBubble,
	StreamContentBubble,
} from "~/components/chat-bubble";
import { ChatInput } from "~/components/chat-input";
import { MobileDrawer } from "~/components/mobile-drawer";

import { ModelsMenu } from "~/components/models-menu";
import { chatClient } from "~/connect";
import { useChatStore } from "~/stores/chat";
import { stripProtoMetadata } from "~/types";
import { QueryKeys } from "~/utils/query";

export function handleNewChat() {
	useChatStore.getState().setConversationId(null);
	document.getElementById("chat-input")?.focus();
}

export default function Chat() {
	const messageEndRef = useRef<HTMLDivElement>(null);

	const { conversationId, isStreaming, streamContent } = useChatStore();

	const { data: messages, isLoading: isMessagesLoading } = useQuery({
		queryKey: QueryKeys.messages(conversationId || ""),
		queryFn: async () => {
			const response = await chatClient.listMessages({
				conversationId: conversationId || undefined,
			});
			return stripProtoMetadata(response.messages);
		},
		enabled: !!conversationId,
	});

	const lastAssistantMessage = messages
		?.filter((msg) => msg.role === "assistant")
		.pop();
	const lastAssistantMessageId = lastAssistantMessage?.id;

	useEffect(() => {
		messageEndRef.current?.scrollIntoView({ behavior: "instant" });
	}, [messages, streamContent]);

	return (
		<VStack w="full" flex={1}>
			<HStack w="full" p={1} px={2}>
				<MobileDrawer />
				<ModelsMenu />
				<Spacer />
				<IconButton
					rounded="full"
					size="xs"
					variant="ghost"
					onClick={() => handleNewChat()}
				>
					<Icon as={RiAddLine} size="md" color="fg.muted" flexShrink={0} />
				</IconButton>
			</HStack>
			{!conversationId && (
				<VStack flex={1} justifyContent="center" alignItems="center">
					<Heading size="2xl">How can I help you?</Heading>
					<HStack color="fg.muted">
						Ask me anything, I'm here to help you.
					</HStack>
				</VStack>
			)}
			{isMessagesLoading && (
				<Center flex={1}>
					<Spinner size="sm" />
				</Center>
			)}
			<VStack
				flex={1}
				p={2}
				w="full"
				overflowY="auto"
				hidden={!conversationId || isMessagesLoading}
			>
				{messages?.map((message) => (
					<ChatBubble
						key={message.id}
						message={message}
						lastAssistantMessageId={lastAssistantMessageId}
					/>
				))}
				{isStreaming && streamContent !== "" && (
					<StreamContentBubble streamContent={streamContent} />
				)}
				{isStreaming && streamContent === "" && <StreamBubble />}
				<div ref={messageEndRef} />
			</VStack>
			<ChatInput />
		</VStack>
	);
}
