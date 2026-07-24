import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { client, handle } from "@/lib/client";
import { useListControls } from "@/hooks/useListControls";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import AlbumCard from "@/components/album/AlbumCard";
import CardGrid from "@/components/ui/CardGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SortDropdownProps } from "@/components/ui/SortDropdown";
import type { DropdownControlsProps } from "@/components/ui/CardGridControls";

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
  pendingComponent: () => <Skeleton variant="grid" />,
  head: () => ({
    meta: [
      {
        title: "Albums",
      },
    ],
  }),
});

function RouteComponent() {
  const options: GetPaginatedAlbumsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedAlbumsOptions>({ page: options.page, data, navigate });

  const sortSettings: SortDropdownProps = {
    options: [
      // { label: "Score", value: "totalScore" },
      { label: "Score", value: "finalScore" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
      { label: "Year", value: "releaseYear" },
    ],
    value: options.orderBy || "createdAt",
    direction: options.order || "desc",
    onSortChange: (value, direction) => {
      navigate({
        search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({
          ...prev,
          orderBy: value as GetPaginatedAlbumsOptions["orderBy"],
          order: direction,
          // Set default secondary sort when year is selected, clear when not
          secondaryOrderBy: value === "releaseYear" ? prev.secondaryOrderBy || "finalScore" : undefined,
          secondaryOrder: value === "releaseYear" ? prev.secondaryOrder || "desc" : undefined,
        }),
      });
    },
  };

  // Secondary sort settings - only show when primary sort is "Year"
  const secondarySortSettings: SortDropdownProps | undefined =
    options.orderBy === "releaseYear"
      ? {
          options: [
            { label: "Score", value: "finalScore" },
            { label: "Name", value: "name" },
            { label: "Date Added", value: "createdAt" },
          ],
          value: options.secondaryOrderBy || "finalScore",
          direction: options.secondaryOrder || "desc",
          onSortChange: (value, direction) => {
            navigate({
              search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({
                ...prev,
                secondaryOrderBy: value as GetPaginatedAlbumsOptions["secondaryOrderBy"],
                secondaryOrder: direction,
              }),
            });
          },
        }
      : undefined;

  const genres = data?.relatedGenres && data.relatedGenres.length > 0 ? data.relatedGenres : data?.genres || [];

  // validateSearch always hands genres over as an array
  const genreSlugs = options.genres ?? [];

  // Find corresponding genres in data.genres
  const selectedGenres = data?.genres?.filter(genre => genreSlugs.includes(genre.slug)) || [];

  // Map selected genres to items first
  const selectedItems = selectedGenres.map(genre => ({
    name: genre.name,
    value: genre.slug,
  }));

  // Map all genres to items, excluding already selected
  const otherItems =
    genres
      ?.filter(genre => !genreSlugs.includes(genre.slug))
      .map(genre => ({
        name: genre.name,
        value: genre.slug,
      })) || [];

  // Combine and sort by name
  const items = [...selectedItems, ...otherItems].sort((a, b) => a.name.localeCompare(b.name));

  const genreSettings: DropdownControlsProps = {
    items,
    selected: genreSlugs,
    onSelect: value => {
      navigate({
        search: prev => ({
          ...prev,
          genres: value.length > 0 ? value : undefined,
        }),
      });
    },
  };

  return (
    <ListPageLayout page={options.page}>
      <CardGrid
        cards={data.albums.map(album => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
        counter={data.totalCount}
        controls={{ search, pagination, sortSettings, secondarySortSettings, genreSettings }}
        sortedByYear={options.orderBy === "releaseYear"}
        cardYears={data.albums.map(album => album.releaseYear)}
      />
    </ListPageLayout>
  );
}
