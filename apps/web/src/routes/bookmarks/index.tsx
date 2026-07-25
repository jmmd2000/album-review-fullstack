import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { useListControls } from "@/hooks/useListControls";

import type { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";

async function fetchPaginatedBookmarkedAlbums(options: GetPaginatedBookmarkedAlbumsOptions) {
  return handle(
    client.api.bookmarks.$get({
      query: {
        ...(options.page ? { page: String(options.page) } : {}),
        ...(options.order ? { order: options.order } : {}),
        ...(options.orderBy ? { orderBy: options.orderBy } : {}),
        ...(options.search ? { search: options.search } : {}),
      },
    })
  );
}

const albumQueryOptions = (options: GetPaginatedBookmarkedAlbumsOptions) =>
  queryOptions({
    queryKey: queryKeys.bookmarks.list(options),
    queryFn: () => fetchPaginatedBookmarkedAlbums(options),
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/bookmarks/")({
  validateSearch: (search: Record<string, unknown>): GetPaginatedBookmarkedAlbumsOptions => {
    const result: GetPaginatedBookmarkedAlbumsOptions = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy: (search.orderBy as GetPaginatedBookmarkedAlbumsOptions["orderBy"]) || "createdAt",
      order: (search.order as GetPaginatedBookmarkedAlbumsOptions["order"]) || "desc",
    };

    // Only include non-default values in the URL
    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "createdAt") delete result.orderBy;
    if (result.order === "desc") delete result.order;

    return result;
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    return context.queryClient.ensureQueryData(albumQueryOptions(deps));
  },
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Bookmarks",
      },
    ],
  }),
});

function RouteComponent() {
  const options: GetPaginatedBookmarkedAlbumsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { pagination } = useListControls<GetPaginatedBookmarkedAlbumsOptions>({ page: options.page, data, navigate });

  return (
    <>
      <h1>Bookmarks</h1>
      <p>{data.totalCount} waiting</p>
      <ul>
        {data.albums.map(album => (
          <li key={album.spotifyID}>
            <Link to="/albums/$albumID/create" params={{ albumID: album.spotifyID }}>
              {album.name}
            </Link>{" "}
            {album.artistName}
          </li>
        ))}
      </ul>
      <p>
        <button type="button" onClick={pagination.prev.action} disabled={pagination.prev.disabled}>
          Previous
        </button>{" "}
        Page {pagination.page.pageNumber} of {pagination.page.totalPages}{" "}
        <button type="button" onClick={pagination.next.action} disabled={pagination.next.disabled}>
          Next
        </button>
      </p>
    </>
  );
}
