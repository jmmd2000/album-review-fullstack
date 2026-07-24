import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { client, handle } from "@/lib/client";
import { useListControls } from "@/hooks/useListControls";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import CardGrid from "@/components/ui/CardGrid";
import ArtistCard from "@/components/artist/ArtistCard";
import type { SortDropdownProps } from "@/components/ui/SortDropdown";

import type { GetPaginatedArtistsOptions } from "@shared/types";
import { PAGE_SIZE } from "@shared/constants";
import { Skeleton } from "@/components/ui/Skeleton";

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
  loader: async ({ deps: { page, search, orderBy, order, scoreType } }: { deps: GetPaginatedArtistsOptions }) => {
    return queryClient.ensureQueryData(artistQueryOptions({ page, search, orderBy, order, scoreType }));
  },
  component: RouteComponent,
  pendingComponent: () => <Skeleton variant="grid" />,
  head: () => ({
    meta: [
      {
        title: "Artists",
      },
    ],
  }),
});

function RouteComponent() {
  const options: GetPaginatedArtistsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(artistQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedArtistsOptions>({ page: options.page, data, navigate });

  const sortSettings: SortDropdownProps = {
    options: [
      { label: "Score", value: "totalScore" },
      { label: "Review Count", value: "reviewCount" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
    ],
    value: options.orderBy || "totalScore",
    direction: options.order || "desc",
    onSortChange: (value, direction) => {
      navigate({
        search: (prev: Partial<GetPaginatedArtistsOptions>) => ({
          ...prev,
          orderBy: value as GetPaginatedArtistsOptions["orderBy"],
          order: direction,
          // Clear scoreType when not sorting by score
          scoreType: value === "totalScore" ? prev.scoreType || "overall" : undefined,
        }),
      });
    },
  };

  // Secondary sort settings - only show when primary sort is "Score"
  const secondarySortSettings: SortDropdownProps | undefined =
    options.orderBy === "totalScore" || !options.orderBy
      ? {
          options: [
            { label: "Overall", value: "overall" },
            { label: "Peak", value: "peak" },
            { label: "Latest", value: "latest" },
          ],
          value: options.scoreType || "overall",
          direction: options.order || "desc",
          onSortChange: (value, direction) => {
            navigate({
              search: (prev: Partial<GetPaginatedArtistsOptions>) => ({
                ...prev,
                scoreType: value as "overall" | "peak" | "latest",
                order: direction,
              }),
            });
          },
        }
      : undefined;

  // Calculate current position for each artist based on sort order
  const artistsWithPosition = data.artists.map((artist, index) => {
    const currentPosition = (options.page || 1) * PAGE_SIZE - PAGE_SIZE + index + 1;

    // Determine which score to display based on sort type
    let displayScore = artist.totalScore;
    if (options.orderBy === "totalScore") {
      if (options.scoreType === "peak") {
        displayScore = artist.peakScore;
      } else if (options.scoreType === "latest") {
        displayScore = artist.latestScore;
      }
    }

    return {
      ...artist,
      currentPosition: currentPosition,
      displayScore: displayScore,
    };
  });

  return (
    <ListPageLayout page={options.page}>
      <CardGrid
        cards={artistsWithPosition.map(artist => (
          <ArtistCard key={artist.spotifyID} artist={artist} />
        ))}
        counter={data.totalCount}
        controls={{ search, pagination, sortSettings, secondarySortSettings }}
      />
    </ListPageLayout>
  );
}
