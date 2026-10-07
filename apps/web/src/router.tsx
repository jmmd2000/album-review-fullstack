import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "@/components/ui/Toaster";
import { measureLandings, prepareMorph } from "@/lib/coverMorph";

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
    defaultViewTransition: {
      // A sort, filter or page number only changes the search, so it switches at once.
      // This runs just before the browser pictures the old page, which is the moment to name the image that flies.
      types: ({ fromLocation, toLocation, pathChanged }) => {
        if (!pathChanged) return false;
        return prepareMorph(fromLocation?.pathname, toLocation.pathname);
      },
    },
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
  router.subscribe("onRendered", measureLandings);
  return router;
}
