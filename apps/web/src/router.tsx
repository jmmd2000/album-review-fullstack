import { createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "@/lib/queryClient";

/** Router factory the start plugin wires into its client and server entries. */
export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    ),
  });
}
