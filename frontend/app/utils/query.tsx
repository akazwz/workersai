import { queryClient } from "~/root";
import type { Conversation, Message } from "~/types";

export const QueryKeys = {
	conversations: () => ["conversations"],
	messages: (conversationId: string) => ["messages", conversationId],
};

export function addQueryConversation(conversation: Conversation) {
	queryClient.setQueryData(
		QueryKeys.conversations(),
		(prev: Conversation[] | undefined) => {
			if (!prev || !Array.isArray(prev)) {
				return [conversation];
			}
			return [...prev, conversation];
		},
	);
}

export function updateConversationTitle(conversationId: string, title: string) {
	queryClient.setQueryData(
		QueryKeys.conversations(),
		(prev: Conversation[] | undefined) => {
			if (!prev || !Array.isArray(prev)) {
				return [];
			}
			return prev.map((conversation) =>
				conversation.id === conversationId
					? { ...conversation, title }
					: conversation,
			);
		},
	);
}

export function updateConversationUpdatedAt(conversationId: string) {
	queryClient.setQueryData(
		QueryKeys.conversations(),
		(prev: Conversation[] | undefined) => {
			if (!prev || !Array.isArray(prev)) {
				return [];
			}
			return prev.map((conversation) =>
				conversation.id === conversationId
					? { ...conversation, updatedAt: new Date().toISOString() }
					: conversation,
			);
		},
	);
}

export function pinConversation(conversationId: string) {
	queryClient.setQueryData(
		QueryKeys.conversations(),
		(prev: Conversation[] | undefined) => {
			if (!prev || !Array.isArray(prev)) {
				return [];
			}
			return prev.map((conversation) =>
				conversation.id === conversationId
					? { ...conversation, pinned: true }
					: conversation,
			);
		},
	);
}

export function unpinConversation(conversationId: string) {
	queryClient.setQueryData(
		QueryKeys.conversations(),
		(prev: Conversation[] | undefined) => {
			if (!prev || !Array.isArray(prev)) {
				return [];
			}
			return prev.map((conversation) =>
				conversation.id === conversationId
					? { ...conversation, pinned: false }
					: conversation,
			);
		},
	);
}

export function addQueryMessage(message: Message) {
	queryClient.setQueryData(
		QueryKeys.messages(message.conversationId),
		(prev: Message[] | undefined) => {
			if (!prev || !Array.isArray(prev)) {
				return [message];
			}
			return [...prev, message];
		},
	);
}

export function removeQueryMessage(message: Message) {
	queryClient.setQueryData(
		QueryKeys.messages(message.conversationId),
		(prev: Message[] | undefined) => {
			return prev?.filter((m) => m.id !== message.id);
		},
	);
}

export function updateQueryMessage(message: Message) {
	queryClient.setQueryData(
		QueryKeys.messages(message.conversationId),
		(prev: Message[] | undefined) => {
			return prev?.map((m) => (m.id === message.id ? message : m));
		},
	);
}
