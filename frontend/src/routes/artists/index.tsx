import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DisplayArtist, GetPaginatedArtistsOptions } from "@shared/types";
import CardGrid from "@components/CardGrid";
import { motion } from "framer-motion";
import ArtistCard from "@/components/ArtistCard";
import { SortDropdownProps } from "@/components/SortDropdown";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchPaginatedArtists(
  options: GetPaginatedArtistsOptions
): Promise<{
  artists: DisplayArtist[];
  furtherPages: boolean;
  totalCount: number;
}> {
  const queryParams = new URLSearchParams();

  if (options.page) queryParams.set("page", String(options.page));
  if (options.order) queryParams.set("order", options.order);
  if (options.orderBy) queryParams.set("orderBy", options.orderBy);
  if (options.search) queryParams.set("search", options.search);
  if (options.scoreType) queryParams.set("scoreType", options.scoreType);

  const response = await fetch(
    `${API_BASE_URL}/api/artists?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch artists");
  }

  return await response.json();
}

const artistQueryOptions = (options: GetPaginatedArtistsOptions) =>
  queryOptions({
    queryKey: ["artists", options],
    queryFn: () => fetchPaginatedArtists(options),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/artists/")({
  validateSearch: (
    search: Record<string, unknown>
  ): GetPaginatedArtistsOptions => {
    const result: GetPaginatedArtistsOptions = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy:
        (search.orderBy as GetPaginatedArtistsOptions["orderBy"]) ||
        "totalScore",
      order: (search.order as GetPaginatedArtistsOptions["order"]) || "desc",
      scoreType:
        (search.scoreType as GetPaginatedArtistsOptions["scoreType"]) ||
        "overall",
    };

    // Only include non-default values in the URL
    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;

    return result;
  },
  loaderDeps: ({ search }: { search: GetPaginatedArtistsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
    scoreType: search.scoreType,
  }),
  loader: async ({
    deps: { page, search, orderBy, order, scoreType },
  }: {
    deps: GetPaginatedArtistsOptions;
  }) => {
    return queryClient.ensureQueryData(
      artistQueryOptions({ page, search, orderBy, order, scoreType })
    );
  },
  component: RouteComponent,
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
  const { data } = useQuery(artistQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const handleNextPage = () => {
    if (data?.furtherPages) {
      navigate({
        search: (prev: Partial<GetPaginatedArtistsOptions>) => ({
          ...prev,
          page: (prev.page || 1) + 1,
        }),
      });
    }
  };

  const handlePrevPage = () => {
    navigate({
      search: (prev: Partial<GetPaginatedArtistsOptions>) => {
        const currentPage = prev.page || 1;
        if (currentPage > 1) {
          return { ...prev, page: currentPage - 1 };
        }
        return prev;
      },
    });
  };

  const handleSearch = (search: string) => {
    navigate({
      search: (prev: Partial<GetPaginatedArtistsOptions>) => ({
        ...prev,
        search,
      }),
    });
  };

  const sortSettings: SortDropdownProps = {
    options: [
      { label: "Score", value: "totalScore" },
      { label: "Review Count", value: "reviewCount" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
    ],
    defaultValue: options.orderBy || "totalScore",
    defaultDirection: options.order || "desc",
    onSortChange: (value, direction) => {
      navigate({
        search: (prev: Partial<GetPaginatedArtistsOptions>) => ({
          ...prev,
          orderBy: value as GetPaginatedArtistsOptions["orderBy"],
          order: direction,
          // Clear scoreType when not sorting by score
          scoreType:
            value === "totalScore" ? prev.scoreType || "overall" : undefined,
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
          defaultValue: options.scoreType || "overall",
          defaultDirection: options.order || "desc",
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

  if (!data || !data.artists) return <div>Loading...</div>;

  // Calculate current position for each artist based on sort order
  const artistsWithPosition = data.artists.map((artist, index) => {
    const currentPosition = (options.page || 1) * 35 - 35 + index + 1;

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
    <motion.div
      key={options.page}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardGrid
        cards={artistsWithPosition.map(artist => (
          <ArtistCard key={artist.spotifyID} artist={artist} />
        ))}
        counter={data.totalCount}
        controls={{
          search: handleSearch,
          pagination: {
            next: { action: handleNextPage, disabled: !data.furtherPages },
            prev: {
              action: handlePrevPage,
              disabled: options.page === 1 || options.page === undefined,
            },
            page: {
              pageNumber: options.page || 1,
              totalPages: Math.ceil(data.totalCount / 35),
            },
          },
          sortSettings: sortSettings,
          secondarySortSettings: secondarySortSettings,
        }}
      />
    </motion.div>
  );
}
