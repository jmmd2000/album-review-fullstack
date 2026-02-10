import { ReactElement } from "react";
import { act, render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, createRootRoute, RouterProvider } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/react-router";
import userEvent from "@testing-library/user-event";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

/**
 * Renders a component with all the app providers (router, query client, etc.)
 * so it behaves like it would in the real app.
 */
export const renderWithProviders = async (
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        // Don't retry failed requests — just fail immediately
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    initialEntries = ["/"],
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) => {
  // RouterProvider can't wrap children, so we put our component inside the route itself
  const rootRoute = createRootRoute({
    component: () => <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  });

  const memoryHistory = createMemoryHistory({ initialEntries });

  const router = createRouter({
    routeTree: rootRoute,
    history: memoryHistory,
    // Skip the loading delay so tests run instantly
    defaultPendingMinMs: 0,
  });

  // Wait for the router to be ready before we render anything
  await router.load();

  // act() lets React finish all its internal updates before we start asserting
  let renderResult: ReturnType<typeof render>;
  await act(async () => {
    renderResult = render(<RouterProvider router={router} />, renderOptions);
  });

  return {
    user: userEvent.setup(),
    ...renderResult!,
    router,
    queryClient,
  };
};
