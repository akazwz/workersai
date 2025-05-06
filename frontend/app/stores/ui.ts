import { create } from "zustand";
import type { Conversation } from "~/types";

interface UIStore {
	renameConversation: Conversation | null;
	setRenameConversation: (renameConversation: Conversation | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
	renameConversation: null,
	setRenameConversation: (renameConversation) => set({ renameConversation }),
}));
