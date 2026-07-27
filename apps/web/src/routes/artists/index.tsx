import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { useListControls } from "@/hooks/useListControls";
import { ArtistCard } from "@/components/artist/ArtistCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { SortSelect } from "@/components/ui/SortSelect";
import { SearchForm } from "@/components/ui/SearchForm";
import { RouteError } from "@/components/ui/RouteError";

import type { DisplayArtist, GetPaginatedArtistsOptions } from "@shared/types";
import type { SortOption } from "@/components/ui/SortSelect";
import { PAGE_SIZE } from "@shared/constants";

const sortOptions: SortOption[] = [
  { label: "Overall Score", value: "totalScore" },
  { label: "Peak Score", value: "peakScore" },
  { label: "Latest Score", value: "latestScore" },
  { label: "Number of Reviews", value: "reviewCount" },
  { label: "Name", value: "name" },
  { label: "Date Added", value: "createdAt" },
];

async function fetchPaginatedArtists(options: GetPaginatedArtistsOptions) {
  return handle(
    client.api.artists.$get({
      query: {
        ...(options.page ? { page: String(options.page) } : {}),
        ...(options.order ? { order: options.order } : {}),
        ...(options.orderBy ? { orderBy: options.orderBy } : {}),
        ...(options.search ? { search: options.search } : {}),
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
    };

    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "totalScore") delete result.orderBy;
    if (result.order === "desc") delete result.order;

    return result;
  },
  loaderDeps: ({ search }: { search: GetPaginatedArtistsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
  }),
  loader: async ({ deps: { page, search, orderBy, order }, context }) => {
    return context.queryClient.ensureQueryData(artistQueryOptions({ page, search, orderBy, order }));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
  head: () => ({
    meta: socialMeta({
      title: "Artists",
      description: "The artist leaderboard, every reviewed artist ranked by score.",
    }),
  }),
});

// The score chip follows whichever score dimension the list is ranked by, so a
// peak or latest sort shows those figures rather than the overall score.
function artistScore(artist: DisplayArtist, orderBy: GetPaginatedArtistsOptions["orderBy"]): number {
  switch (orderBy) {
    case "peakScore":
      return artist.peakScore;
    case "latestScore":
      return artist.latestScore;
    default:
      return artist.totalScore;
  }
}

// The card position is the row's place in the current ranking. Name and date
// sorts are not rankings, so no position is shown for them.
function isRankingSort(orderBy: GetPaginatedArtistsOptions["orderBy"]): boolean {
  return orderBy === "totalScore" || orderBy === "peakScore" || orderBy === "latestScore" || orderBy === "reviewCount";
}

function RouteComponent() {
  const options: GetPaginatedArtistsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(artistQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedArtistsOptions>({ page: options.page, data, navigate });
  const orderBy = options.orderBy ?? "totalScore";
  const order = options.order ?? "desc";
  const firstPosition = ((options.page ?? 1) - 1) * PAGE_SIZE;
  const showPosition = isRankingSort(orderBy);

  return (
    <>
      <PageHeader title="Artists" eyebrow={`${data.totalCount} reviewed`}>
        <SearchForm label="Search artists" defaultValue={options.search ?? ""} onSearch={search} />
        <SortSelect
          options={sortOptions}
          value={orderBy}
          direction={order}
          onSortChange={(value, direction) => {
            navigate({
              search: prev => ({
                ...prev,
                orderBy: value as GetPaginatedArtistsOptions["orderBy"],
                order: direction,
                page: undefined,
              }),
            });
          }}
        />
      </PageHeader>
      {data.artists.length === 0 ? (
        <PageState title="No artists found" detail="Try a different search." />
      ) : (
        <>
          <CardGrid>
            {data.artists.map((artist, index) => (
              <ArtistCard key={artist.spotifyID} artist={artist} position={artist.unrated || !showPosition ? null : firstPosition + index + 1} score={artistScore(artist, orderBy)} />
            ))}
          </CardGrid>
          <Pagination pagination={pagination} />
        </>
      )}
    </>
  );
}
