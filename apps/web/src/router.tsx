import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "@/components/ui/Toaster";

/**
 * Creates the router. TanStack Start calls this from its client and server entries.
 * Each call makes a new query client: one for each request on the server, and one for the tab in the browser.
 * Loaders get the query client from the router context.
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
  // Sends the data from the server loaders to the browser's query cache, so hydration doesn't fetch it again.
  // This also wraps the app in QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
