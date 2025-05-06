import { createClient, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { ChatService } from "~/gen/chat/v1/chat_pb";

const authInterceptor: Interceptor = (next) => async (req) => {
	let accessToken = localStorage.getItem("accessToken");
	if (accessToken) {
		req.header.set("authorization", accessToken);
	}
	return next(req);
};

export const transport = createConnectTransport({
	baseUrl: import.meta.env.VITE_API_URL,
	interceptors: [authInterceptor],
});

export const chatClient = createClient(ChatService, transport);
