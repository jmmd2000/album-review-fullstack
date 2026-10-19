import { createRouter, ErrorComponent } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "@/components/ui/Toaster";
import { isLoaderError, reportBrowserError, startBrowserErrorReporting } from "@/lib/browserErrorReporting";
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
    // Gives every route an error boundary, so defaultOnCatch can report a render error. This is the router's own error screen.
    defaultErrorComponent: ErrorComponent,
    defaultOnCatch: error => {
      if (!isLoaderError(router.state.matches, error)) reportBrowserError(error);
    },
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
  if (!router.isServer) {
    startBrowserErrorReporting();
    // Only a route can have an onError, and it runs for loaders that run in the browser. So each route gets the same one.
    for (const route of Object.values(router.routesById)) route.options.onError = reportBrowserError;
  }
  router.subscribe("onRendered", measureLandings);
  return router;
}
