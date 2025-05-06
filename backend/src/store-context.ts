import { createContextKey } from "@connectrpc/connect";

type User = {
	accessToken: string;
};

export const userStore = createContextKey<User | undefined>(undefined);
