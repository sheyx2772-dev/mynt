import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";

// One query client for the application.
//
// The defaults below are the ones this panel actually wants, rather than the
// library's. An admin screen is read by somebody deciding something, so stale
// numbers are worse than a extra request — but a panel left open on a second
// monitor should not poll the backend all afternoon either, which is what
// refetching on every window focus amounts to.
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
			// A 401 is an answer, not a fault. Retrying it delays the sign-in screen
			// by three round trips and cannot succeed.
			retry: (failureCount, error) =>
				!(error instanceof Response && error.status === 401) &&
				failureCount < 2,
		},
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
);
