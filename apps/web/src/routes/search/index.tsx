import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import type { SearchAlbumsOptions } from "@shared/types";

async function searchSpotifyAlbums(query: SearchAlbumsOptions) {
  return handle(client.api.spotify.albums.search.$get({ query: { query: String(query.query) } }));
}

const searchQueryOptions = (query: SearchAlbumsOptions) =>
  queryOptions({
    queryKey: queryKeys.search(query),
    queryFn: () => searchSpotifyAlbums(query),
  });

export const Route = createFileRoute("/search/")({
  validateSearch: (search: Record<string, unknown>): SearchAlbumsOptions => {
    const result: SearchAlbumsOptions = {
      query: (search.query as string) || "",
    };

    if (result.query === "") delete result.query;

    return result;
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: { query }, context }) => {
    return context.queryClient.ensureQueryData(searchQueryOptions({ query }));
  },
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Search Albums",
      },
    ],
  }),
});

function RouteComponent() {
  const options: SearchAlbumsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(searchQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <>
      <h1>Search</h1>
      <form
        onSubmit={event => {
          event.preventDefault();
          const query = new FormData(event.currentTarget).get("query")?.toString() ?? "";
          navigate({ search: (prev: Partial<SearchAlbumsOptions>) => ({ ...prev, query }) });
        }}
      >
        <input name="query" type="search" defaultValue={options.query ?? ""} aria-label="Search Spotify albums" />
        <button type="submit">Search</button>
      </form>
      <ul>
        {(data ?? []).map(album => (
          <li key={album.spotifyID}>
            {album.name} {album.artistName} {album.finalScore != null ? album.finalScore : "unreviewed"}
          </li>
        ))}
      </ul>
    </>
  );
}
