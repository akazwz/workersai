import { create } from "zustand";

const DEFAULT_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

interface ChatStore {
	conversationId: string | null;
	model: string;
	streamContent: string;
	isStreaming: boolean;
	conversationSearch: string;
	setConversationId: (conversationId: string | null) => void;
	setModel: (model: string) => void;
	appendStreamContent: (streamContent: string) => void;
	clearStreamContent: () => void;
	setIsStreaming: (isStreaming: boolean) => void;
	setConversationSearch: (conversationSearch: string) => void;
}

const updateUrlQueryParams = (params: Record<string, string | null>) => {
	if (typeof window === "undefined") {
		return;
	}
	const searchParams = new URLSearchParams(window.location.search);
	Object.entries(params).forEach(([key, value]) => {
		if (value === null || value === undefined) {
			searchParams.delete(key);
		} else {
			searchParams.set(key, value);
		}
	});
	const newUrl = `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`;
	window.history.replaceState(
		{ ...window.history.state, as: newUrl, url: newUrl },
		"",
		newUrl,
	);
};

let initialConversationId: string | null = null;
let initialModel: string = "";

if (typeof window !== "undefined") {
	const searchParams = new URLSearchParams(window.location.search);
	initialConversationId = searchParams.get("conversationId");
	initialModel = searchParams.get("model") ?? DEFAULT_MODEL;
}

export const useChatStore = create<ChatStore>((set) => ({
	conversationId: initialConversationId,
	model: initialModel,
	streamContent: "",
	isStreaming: false,
	conversationSearch: "",
	setConversationId: (conversationId) => {
		set({ conversationId });
		updateUrlQueryParams({ conversationId });
	},
	setModel: (model) => {
		set({ model });
		updateUrlQueryParams({ model });
	},
	appendStreamContent: (streamContent) => {
		set((state) => ({ streamContent: state.streamContent + streamContent }));
	},
	clearStreamContent: () => {
		set({ streamContent: "" });
	},
	setIsStreaming: (isStreaming) => {
		set({ isStreaming });
	},
	setConversationSearch: (conversationSearch) => {
		set({ conversationSearch });
		updateUrlQueryParams({ conversationSearch });
	},
}));
