import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { useListControls } from "@/hooks/useListControls";
import { ArtistCard } from "@/components/artist/ArtistCard";
import cardStyles from "@/components/artist/ArtistCard.module.css";

import type { DisplayArtist, GetPaginatedArtistsOptions } from "@shared/types";

async function fetchPaginatedArtists(options: GetPaginatedArtistsOptions) {
  return handle(
    client.api.artists.$get({
      query: {
        ...(options.page ? { page: String(options.page) } : {}),
        ...(options.order ? { order: options.order } : {}),
        ...(options.orderBy ? { orderBy: options.orderBy } : {}),
        ...(options.search ? { search: options.search } : {}),
        ...(options.scoreType ? { scoreType: options.scoreType } : {}),
      },
    })
  );
}

const artistQueryOptions = (options: GetPaginatedArtistsOptions) =>
  queryOptions({
    queryKey: queryKeys.artists.list(options),
    queryFn: () => fetchPaginatedArtists(options),
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/artists/")({
  ssr: true,
  validateSearch: (search: Record<string, unknown>): GetPaginatedArtistsOptions => {
    const result: GetPaginatedArtistsOptions = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy: (search.orderBy as GetPaginatedArtistsOptions["orderBy"]) || "totalScore",
      order: (search.order as GetPaginatedArtistsOptions["order"]) || "desc",
      scoreType: (search.scoreType as GetPaginatedArtistsOptions["scoreType"]) || "overall",
    };

    // Only include non-default values in the URL
    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "totalScore") delete result.orderBy;
    if (result.order === "desc") delete result.order;
    if (result.scoreType === "overall") delete result.scoreType;

    return result;
  },
  loaderDeps: ({ search }: { search: GetPaginatedArtistsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
    scoreType: search.scoreType,
  }),
  loader: async ({ deps: { page, search, orderBy, order, scoreType }, context }) => {
    return context.queryClient.ensureQueryData(artistQueryOptions({ page, search, orderBy, order, scoreType }));
  },
  component: RouteComponent,
  head: () => ({
    meta: socialMeta({
      title: "Artists",
      description: "The artist leaderboard, every reviewed artist ranked by score.",
    }),
  }),
});

function artistScore(artist: DisplayArtist, scoreType: GetPaginatedArtistsOptions["scoreType"]): number {
  switch (scoreType) {
    case "peak":
      return artist.peakScore;
    case "latest":
      return artist.latestScore;
    default:
      return artist.totalScore;
  }
}

function artistPosition(artist: DisplayArtist, scoreType: GetPaginatedArtistsOptions["scoreType"]): number | null {
  switch (scoreType) {
    case "peak":
      return artist.peakLeaderboardPosition;
    case "latest":
      return artist.latestLeaderboardPosition;
    default:
      return artist.leaderboardPosition;
  }
}

function RouteComponent() {
  const options: GetPaginatedArtistsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(artistQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedArtistsOptions>({ page: options.page, data, navigate });
  const scoreType = options.scoreType ?? "overall";

  return (
    <>
      <h1>Artists</h1>
      <p>{data.totalCount} reviewed</p>
      <form
        onSubmit={event => {
          event.preventDefault();
          search(new FormData(event.currentTarget).get("query")?.toString() ?? "");
        }}
      >
        <input name="query" type="search" defaultValue={options.search ?? ""} aria-label="Search artists" />
        <button type="submit">Search</button>
      </form>
      <div className={cardStyles.grid}>
        {data.artists.map(artist => (
          <ArtistCard key={artist.spotifyID} artist={artist} position={artistPosition(artist, scoreType)} score={artistScore(artist, scoreType)} />
        ))}
      </div>
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
