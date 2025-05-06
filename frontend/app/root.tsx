import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import { Toaster } from "~/components/ui/toaster";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export const queryClient = new QueryClient();

export default function App() {
	return (
		<ChakraProvider value={defaultSystem}>
			<QueryClientProvider client={queryClient}>
				<Outlet />
				<Toaster />
			</QueryClientProvider>
		</ChakraProvider>
	);
}
