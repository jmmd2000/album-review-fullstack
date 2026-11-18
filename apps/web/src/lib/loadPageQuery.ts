import type { FetchQueryOptions, QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Loads a page's data in its route loader. A cached copy comes back at once and is refreshed in the
 * background. A copy marked out of date, or no copy at all, is fetched before the page shows.
 */
export function loadPageQuery<TData, TQueryKey extends QueryKey>(queryClient: QueryClient, options: FetchQueryOptions<TData, Error, TData, TQueryKey>): Promise<TData> {
  const cached = queryClient.getQueryState<TData>(options.queryKey);
  if (cached?.data === undefined || cached.isInvalidated) return queryClient.fetchQuery(options);

  void queryClient.refetchQueries({ queryKey: options.queryKey, exact: true });
  return Promise.resolve(cached.data);
}
