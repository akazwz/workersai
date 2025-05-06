import { createConnectRouter } from "@connectrpc/connect";
import {
	universalServerRequestFromFetch,
	universalServerResponseToFetch,
} from "@connectrpc/connect/protocol";
import type {
	ConnectRouter,
	ConnectRouterOptions,
	ContextValues,
	Interceptor,
} from "@connectrpc/connect";
import type { UniversalHandler } from "@connectrpc/connect/protocol";

interface WokerHandlerOptions<Env> extends ConnectRouterOptions {
	routes: (router: ConnectRouter) => void;
	contextValues?: (
		req: Request,
		env: Env,
		ctx: ExecutionContext,
	) => ContextValues;
	notFound?: (
		req: Request,
		env: Env,
		ctx: ExecutionContext,
	) => Promise<Response>;
	interceptors?: Interceptor[];
}

export function createWorkerHandler<Env>(options: WokerHandlerOptions<Env>) {
	const router = createConnectRouter({
		interceptors: options.interceptors,
	});
	options.routes(router);
	const paths = new Map<string, UniversalHandler>();
	for (const uHandler of router.handlers) {
		paths.set(uHandler.requestPath, uHandler);
	}
	return {
		async fetch(req: Request, env: Env, ctx: ExecutionContext) {
			const url = new URL(req.url);
			const handler = paths.get(url.pathname);
			if (handler === undefined) {
				return (
					(await options?.notFound?.(req, env, ctx)) ??
					new Response("Not found", { status: 404 })
				);
			}
			const uReq = {
				...universalServerRequestFromFetch(req, {}),
				contextValues: options?.contextValues?.(req, env, ctx),
			};
			const uRes = await handler(uReq);
			return universalServerResponseToFetch(uRes);
		},
	};
}
