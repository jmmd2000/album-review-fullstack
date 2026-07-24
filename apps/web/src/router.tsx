import { createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { routeTree } from "./routeTree.gen";

/**
 * Router factory the start plugin wires into its client and server entries.
 * Each call gets its own query client, one per request on the server, one
 * for the lifetime of the tab in the browser. Loaders reach it through
 * router context rather than a module import.
 */
export function getRouter() {
  const queryClient = new QueryClient();
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    context: { queryClient },
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    ),
  });
}
