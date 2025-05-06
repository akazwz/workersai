import { Button, Menu, Text, Portal, Icon } from "@chakra-ui/react";
import {
	RiDeleteBinLine,
	RiEditBoxLine,
	RiPushpinLine,
	RiUnpinLine,
} from "react-icons/ri";

import { chatClient } from "~/connect";
import { queryClient } from "~/root";
import { useChatStore } from "~/stores/chat";
import { useUIStore } from "~/stores/ui";
import type { Conversation } from "~/types";
import { unpinConversation } from "~/utils/query";
import { pinConversation } from "~/utils/query";

export function ConversationItem({
	conversation,
	containerRef,
	closeRef,
}: {
	conversation: Conversation;
	containerRef?: React.RefObject<HTMLDivElement>;
	closeRef?: React.RefObject<HTMLButtonElement>;
}) {
	const { conversationId, setConversationId } = useChatStore();

	const { setRenameConversation } = useUIStore();

	const isActive = conversationId === conversation.id;

	function doWithCloseMenu(fn: () => void) {
		fn();
		closeRef?.current?.click();
	}

	function handleSelectConversation(conversationId: string) {
		useChatStore.getState().setConversationId(conversationId);
		document.getElementById("chat-input")?.focus();
	}

	function handleDeleteConversation() {
		chatClient.deleteConversation({
			conversationId: conversation.id,
		});
		queryClient.setQueryData(["conversations"], (prev: Conversation[]) => {
			return prev.filter((c) => c.id !== conversation.id);
		});
		if (isActive) {
			setConversationId(null);
		}
	}

	function handleRenameConversation() {
		setRenameConversation(conversation);
	}

	function handlePinConveration() {
		chatClient.pinConversation({
			conversationId: conversation.id,
		});
		pinConversation(conversation.id);
	}

	function handleUnpinConversation() {
		chatClient.unpinConversation({
			conversationId: conversation.id,
		});
		unpinConversation(conversation.id);
	}

	return (
		<Menu.Root key={conversation.id}>
			<Menu.ContextTrigger asChild>
				<Button
					onClick={() => {
						doWithCloseMenu(() => handleSelectConversation(conversation.id));
					}}
					variant={isActive ? "surface" : "ghost"}
					w="full"
					size="xs"
					justifyContent="flex-start"
				>
					<Text truncate>{conversation.title || "New Chat"}</Text>
				</Button>
			</Menu.ContextTrigger>
			<Portal container={containerRef}>
				<Menu.Positioner>
					<Menu.Content>
						<Menu.Item
							value="delete"
							color="fg.error"
							_hover={{ bg: "bg.error", color: "fg.error" }}
							onClick={() => handleDeleteConversation()}
						>
							<Icon as={RiDeleteBinLine} />
							Delete
						</Menu.Item>
						<Menu.Item
							value="rename"
							onClick={() => doWithCloseMenu(handleRenameConversation)}
						>
							<Icon as={RiEditBoxLine} />
							Rename
						</Menu.Item>
						<Menu.Item
							value="pin"
							onClick={() => {
								if (conversation.pinned) {
									handleUnpinConversation();
								} else {
									handlePinConveration();
								}
							}}
						>
							<Icon as={conversation.pinned ? RiUnpinLine : RiPushpinLine} />
							{conversation.pinned ? "Unpin" : "Pin"}
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
}
