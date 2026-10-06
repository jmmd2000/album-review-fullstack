import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "@/components/ui/Toaster";

/**
 * Router factory the start plugin wires into its client and server entries.
 * Each call gets its own query client, one per request on the server, one
 * for the lifetime of the tab in the browser. Loaders reach it through
 * router context rather than a module import.
 */
export function getRouter() {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    context: { queryClient },
    Wrap: ({ children }) => (
      <>
        {children}
        <Toaster />
      </>
    ),
  });
  // Streams whatever the server loaders fetched into the client cache so
  // hydration reuses it instead of refetching. Also wraps the app in the
  // QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
