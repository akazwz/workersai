import {
	type RouteConfig,
	index,
	route,
	layout,
} from "@react-router/dev/routes";

export default [
	layout("routes/layout.tsx", [
		index("routes/chat.tsx"),
		route("knowledges", "routes/knowledges.tsx"),
	]),
] satisfies RouteConfig;
