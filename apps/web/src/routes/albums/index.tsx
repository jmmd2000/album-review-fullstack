import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { useListControls } from "@/hooks/useListControls";

import type { GetPaginatedAlbumsOptions } from "@shared/types";

async function fetchPaginatedAlbums(options: GetPaginatedAlbumsOptions) {
  return handle(
    client.api.albums.$get({
      query: {
        ...(options.page ? { page: String(options.page) } : {}),
        ...(options.order ? { order: options.order } : {}),
        ...(options.orderBy ? { orderBy: options.orderBy } : {}),
        ...(options.search ? { search: options.search } : {}),
        ...(options.genres && options.genres.length > 0 ? { genres: options.genres.join(",") } : {}),
        ...(options.secondaryOrderBy ? { secondaryOrderBy: options.secondaryOrderBy } : {}),
        ...(options.secondaryOrder ? { secondaryOrder: options.secondaryOrder } : {}),
      },
    })
  );
}

const albumQueryOptions = (options: GetPaginatedAlbumsOptions) =>
  queryOptions({
    queryKey: queryKeys.albums.list(options),
    queryFn: () => fetchPaginatedAlbums(options),
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/albums/")({
  ssr: true,
  validateSearch: (search: Record<string, unknown>): GetPaginatedAlbumsOptions => {
    // The genre filter arrives as an array from in-app navigation but old
    // links may still carry the comma string form
    const rawGenres = search.genres;
    const genres = Array.isArray(rawGenres) ? (rawGenres as string[]) : typeof rawGenres === "string" && rawGenres !== "" ? rawGenres.split(",") : [];

    const result: GetPaginatedAlbumsOptions = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy: (search.orderBy as GetPaginatedAlbumsOptions["orderBy"]) || "createdAt",
      order: (search.order as GetPaginatedAlbumsOptions["order"]) || "desc",
      genres,
      secondaryOrderBy: search.secondaryOrderBy as GetPaginatedAlbumsOptions["secondaryOrderBy"],
      secondaryOrder: search.secondaryOrder as GetPaginatedAlbumsOptions["secondaryOrder"],
    };

    // Only include non-default values in the URL
    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "createdAt") delete result.orderBy;
    if (result.order === "desc") delete result.order;
    if (genres.length === 0) delete result.genres;
    if (!result.secondaryOrderBy) delete result.secondaryOrderBy;
    if (!result.secondaryOrder) delete result.secondaryOrder;

    return result;
  },
  // The whole search state feeds the loader, so a genre-filtered visit
  // preloads the filtered list instead of the unfiltered one
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    return context.queryClient.ensureQueryData(albumQueryOptions(deps));
  },
  component: RouteComponent,
  head: () => ({
    meta: socialMeta({
      title: "Albums",
      description: "Every album I have reviewed, scored out of 100.",
    }),
  }),
});

function RouteComponent() {
  const options: GetPaginatedAlbumsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedAlbumsOptions>({ page: options.page, data, navigate });

  return (
    <>
      <h1>Albums</h1>
      <p>{data.totalCount} reviewed</p>
      <form
        onSubmit={event => {
          event.preventDefault();
          search(new FormData(event.currentTarget).get("query")?.toString() ?? "");
        }}
      >
        <input name="query" type="search" defaultValue={options.search ?? ""} aria-label="Search albums" />
        <button type="submit">Search</button>
      </form>
      <ul>
        {data.albums.map(album => (
          <li key={album.spotifyID}>
            <Link to={album.finalScore != null ? "/albums/$albumID" : "/albums/$albumID/create"} params={{ albumID: album.spotifyID }}>
              {album.name}
            </Link>{" "}
            {album.artistName} {album.finalScore != null ? album.finalScore : "unreviewed"}
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
