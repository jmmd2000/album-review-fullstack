import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GetPaginatedAlbumsOptions, PaginatedAlbumsResult } from "@shared/types";
import AlbumCard from "@components/AlbumCard";
import CardGrid from "@components/CardGrid";
import { motion } from "framer-motion";
import { SortDropdownProps } from "@/components/SortDropdown";
import { DropdownControlsProps } from "@/components/CardGridControls";
import { api } from "@/lib/api";

async function fetchPaginatedAlbums(
  options: GetPaginatedAlbumsOptions
): Promise<PaginatedAlbumsResult> {
  const queryParams = new URLSearchParams();

  if (options.page) queryParams.set("page", String(options.page));
  if (options.order) queryParams.set("order", options.order);
  if (options.orderBy) queryParams.set("orderBy", options.orderBy);
  if (options.search) queryParams.set("search", options.search);
  if (options.genres) {
    const genres = Array.isArray(options.genres) ? options.genres.join(",") : options.genres;
    queryParams.set("genres", genres);
  }
  if (options.secondaryOrderBy) queryParams.set("secondaryOrderBy", options.secondaryOrderBy);
  if (options.secondaryOrder) queryParams.set("secondaryOrder", options.secondaryOrder);

  return api.get(`/api/albums?${queryParams.toString()}`);
}

const albumQueryOptions = (options: GetPaginatedAlbumsOptions) =>
  queryOptions({
    queryKey: ["albums", options],
    queryFn: () => fetchPaginatedAlbums(options),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/albums/")({
  loaderDeps: ({ search }: { search: GetPaginatedAlbumsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
    secondaryOrderBy: search.secondaryOrderBy,
    secondaryOrder: search.secondaryOrder,
  }),
  loader: async ({
    deps: { page, search, orderBy, order, secondaryOrderBy, secondaryOrder },
  }: {
    deps: GetPaginatedAlbumsOptions;
  }) => {
    return queryClient.ensureQueryData(
      albumQueryOptions({
        page,
        search,
        orderBy,
        order,
        secondaryOrderBy,
        secondaryOrder,
      })
    );
  },
  component: RouteComponent,
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
  const { data } = useQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const handleNextPage = () => {
    if (data?.furtherPages) {
      navigate({
        search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({
          ...prev,
          page: (prev.page || 1) + 1,
        }),
      });
    }
  };

  const handlePrevPage = () => {
    navigate({
      search: (prev: Partial<GetPaginatedAlbumsOptions>) => {
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
      search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({
        ...prev,
        search,
      }),
    });
  };

  const sortSettings: SortDropdownProps = {
    options: [
      // { label: "Score", value: "totalScore" },
      { label: "Score", value: "finalScore" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
      { label: "Year", value: "releaseYear" },
    ],
    defaultValue: options.orderBy || "createdAt",
    defaultDirection: options.order || "desc",
    onSortChange: (value, direction) => {
      navigate({
        search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({
          ...prev,
          orderBy: value,
          order: direction,
          // Set default secondary sort when year is selected, clear when not
          secondaryOrderBy:
            value === "releaseYear" ? prev.secondaryOrderBy || "finalScore" : undefined,
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
          defaultValue: options.secondaryOrderBy || "finalScore",
          defaultDirection: options.secondaryOrder || "desc",
          onSortChange: (value, direction) => {
            navigate({
              search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({
                ...prev,
                secondaryOrderBy: value,
                secondaryOrder: direction,
              }),
            });
          },
        }
      : undefined;

  const genres =
    data?.relatedGenres && data.relatedGenres.length > 0
      ? data.relatedGenres
      : data?.genres || [];

  // Get genre slugs from URL (as string or array)
  const genreSlugs = options.genres
    ? Array.isArray(options.genres)
      ? options.genres
      : typeof options.genres === "string"
        ? (options.genres as string).split(",")
        : []
    : [];

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
    onSelect: value => {
      navigate({
        search: prev => ({
          ...prev,
          genres: value.length > 0 ? value.join(",") : undefined,
        }),
      });
    },
  };

  if (!data || !data.albums) return <div>Loading...</div>;
  return (
    <motion.div
      key={options.page}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardGrid
        cards={data.albums.map(album => (
          <AlbumCard key={album.spotifyID} album={album} />
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
          genreSettings: genreSettings,
        }}
        sortedByYear={options.orderBy === "releaseYear"}
        cardYears={data.albums.map(album => album.releaseYear)}
      />
    </motion.div>
  );
}
