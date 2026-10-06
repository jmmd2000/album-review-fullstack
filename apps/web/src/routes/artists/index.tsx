import { Fragment } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { groupBySeparator, letterSeparator, scoreSeparator } from "@/lib/separators";
import { useListControls } from "@/hooks/useListControls";
import { ArtistCard } from "@/components/artist/ArtistCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { SortTabs } from "@/components/ui/SortTabs";
import { SearchForm } from "@/components/ui/SearchForm";
import { RouteError } from "@/components/ui/RouteError";
import { Checkbox } from "@/components/ui/Checkbox";
import { SeparatorTile } from "@/components/ui/SeparatorTile";

import type { DisplayArtist, GetPaginatedArtistsOptions } from "@shared/types";
import type { SortOption } from "@/components/ui/SortTabs";
import type { Separator } from "@/lib/separators";
import { PAGE_SIZE } from "@shared/constants";

interface ArtistsSearch extends GetPaginatedArtistsOptions {
  /** "off" hides the separator tiles. It only changes the page, so it isn't sent to the API */
  groups?: "off";
}

const sortOptions: SortOption[] = [
  { label: "Score", value: "totalScore", direction: "desc" },
  { label: "Peak", value: "peakScore", direction: "desc" },
  { label: "Latest", value: "latestScore", direction: "desc" },
  { label: "Most reviewed", value: "reviewCount", direction: "desc" },
  { label: "Name", value: "name", direction: "asc" },
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
  validateSearch: (search: Record<string, unknown>): ArtistsSearch => {
    const result: ArtistsSearch = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy: (search.orderBy as GetPaginatedArtistsOptions["orderBy"]) || "totalScore",
      order: (search.order as GetPaginatedArtistsOptions["order"]) || "desc",
      groups: search.groups === "off" ? "off" : undefined,
    };

    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "totalScore") delete result.orderBy;
    if (result.order === "desc") delete result.order;
    if (!result.groups) delete result.groups;

    return result;
  },
  loaderDeps: ({ search }: { search: ArtistsSearch }) => ({
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

// Score sorts group by the tier of the score shown on the card. Most reviewed isn't grouped.
function isGroupedSort(orderBy: GetPaginatedArtistsOptions["orderBy"]): boolean {
  return orderBy === "totalScore" || orderBy === "peakScore" || orderBy === "latestScore" || orderBy === "name";
}

function artistSeparator(artist: DisplayArtist, orderBy: GetPaginatedArtistsOptions["orderBy"]): Separator | null {
  switch (orderBy) {
    case "totalScore":
    case "peakScore":
    case "latestScore":
      return scoreSeparator(artist.unrated ? null : artistScore(artist, orderBy));
    case "name":
      return letterSeparator(artist.name);
    default:
      return null;
  }
}

function RouteComponent() {
  const options = Route.useSearch();
  const { data } = useSuspenseQuery(artistQueryOptions(Route.useLoaderDeps()));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search } = useListControls<GetPaginatedArtistsOptions>({ navigate });
  const orderBy = options.orderBy ?? "totalScore";
  const order = options.order ?? "desc";
  const firstPosition = ((options.page ?? 1) - 1) * PAGE_SIZE;
  const showPosition = isRankingSort(orderBy);
  const showTiles = isGroupedSort(orderBy) && options.groups !== "off";

  return (
    <>
      <PageHeader title="Artists" count={data.totalCount}>
        <SearchForm label="Search artists" defaultValue={options.search ?? ""} onSearch={search} />
        <SortTabs
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
        {isGroupedSort(orderBy) && <Checkbox label="Groups" checked={showTiles} onChange={checked => navigate({ search: prev => ({ ...prev, groups: checked ? undefined : "off" }) })} />}
      </PageHeader>
      {data.artists.length === 0 ? (
        <PageState title="No artists found" detail="Try a different search." />
      ) : (
        <>
          <CardGrid>
            {groupBySeparator(data.artists, artist => (showTiles ? artistSeparator(artist, orderBy) : null)).map((group, groupIndex) => (
              <Fragment key={groupIndex}>
                {group.separator && <SeparatorTile {...group.separator} />}
                {group.items.map(artist => (
                  <ArtistCard
                    key={artist.spotifyID}
                    artist={artist}
                    position={artist.unrated || !showPosition ? null : firstPosition + data.artists.indexOf(artist) + 1}
                    score={artistScore(artist, orderBy)}
                  />
                ))}
              </Fragment>
            ))}
          </CardGrid>
          <Pagination page={options.page ?? 1} totalCount={data.totalCount} />
        </>
      )}
    </>
  );
}
