import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DisplayAlbum, GetPaginatedAlbumsOptions } from "@shared/types";
import AlbumCard from "@components/AlbumCard";
import CardGrid from "@components/CardGrid";
import { motion } from "framer-motion";
import { SortDropdownProps } from "@/components/SortDropdown";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchPaginatedAlbums(options: GetPaginatedAlbumsOptions): Promise<{ albums: DisplayAlbum[]; furtherPages: boolean; totalCount: number }> {
  const queryParams = new URLSearchParams();

  if (options.page) queryParams.set("page", String(options.page));
  if (options.order) queryParams.set("order", options.order);
  if (options.orderBy) queryParams.set("orderBy", options.orderBy);
  if (options.search) queryParams.set("search", options.search);

  const response = await fetch(`${API_BASE_URL}/api/albums?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }

  return await response.json();
}

const albumQueryOptions = (options: GetPaginatedAlbumsOptions) =>
  queryOptions({
    queryKey: ["albums", options],
    queryFn: () => fetchPaginatedAlbums(options),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/albums/")({
  loaderDeps: ({ search }: { search: GetPaginatedAlbumsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
  }),
  loader: async ({ deps: { page, search, orderBy, order } }: { deps: GetPaginatedAlbumsOptions }) => {
    return queryClient.ensureQueryData(albumQueryOptions({ page, search, orderBy, order }));
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
        search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({ ...prev, page: (prev.page || 1) + 1 }),
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
      search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({ ...prev, search }),
    });
  };

  const sortSettings: SortDropdownProps = {
    options: [
      // { label: "Score", value: "totalScore" },
      { label: "Score", value: "reviewScore" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
      { label: "Year", value: "releaseYear" },
    ],
    defaultValue: options.orderBy || "createdAt",
    defaultDirection: options.order || "desc",
    onSortChange: (value, direction) => {
      navigate({
        search: (prev: Partial<GetPaginatedAlbumsOptions>) => ({ ...prev, orderBy: value, order: direction }),
      });
    },
  };

  if (!data || !data.albums) return <div>Loading...</div>;
  return (
    <motion.div key={options.page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <CardGrid
        cards={data.albums.map((album) => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
        options={{ search: true, pagination: true, counter: data.totalCount }}
        nextPage={{ action: handleNextPage, disabled: !data.furtherPages }}
        previousPage={{ action: handlePrevPage, disabled: options.page === 1 || options.page === undefined }}
        pageData={{ pageNumber: options.page || 1, totalPages: Math.ceil(data.totalCount / 35) }}
        search={handleSearch}
        sortSettings={sortSettings}
      />
    </motion.div>
  );
}
