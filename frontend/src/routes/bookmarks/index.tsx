import AlbumCard from "@/components/album/AlbumCard";
import CardGrid from "@/components/ui/CardGrid";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { SortDropdownProps } from "@/components/ui/SortDropdown";
import { api } from "@/lib/api";
import { queryClient } from "@/main";
import { DisplayAlbum, GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";

async function fetchPaginatedBookmarkedAlbums(
  options: GetPaginatedBookmarkedAlbumsOptions
): Promise<{ albums: DisplayAlbum[]; furtherPages: boolean; totalCount: number }> {
  const queryParams = new URLSearchParams();

  if (options.page) queryParams.set("page", String(options.page));
  if (options.order) queryParams.set("order", options.order);
  if (options.orderBy) queryParams.set("orderBy", options.orderBy);
  if (options.search) queryParams.set("search", options.search);

  return api.get<{
    albums: DisplayAlbum[];
    furtherPages: boolean;
    totalCount: number;
  }>(`/api/bookmarks?${queryParams.toString()}`);
}

const albumQueryOptions = (options: GetPaginatedBookmarkedAlbumsOptions) =>
  queryOptions({
    queryKey: ["bookmarkedAlbums", options],
    queryFn: () => fetchPaginatedBookmarkedAlbums(options),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/bookmarks/")({
  loaderDeps: ({ search }: { search: GetPaginatedBookmarkedAlbumsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
  }),
  loader: async ({
    deps: { page, search, orderBy, order },
  }: {
    deps: GetPaginatedBookmarkedAlbumsOptions;
  }) => {
    return queryClient.ensureQueryData(albumQueryOptions({ page, search, orderBy, order }));
  },
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Bookmarks",
      },
    ],
  }),
});

function RouteComponent() {
  const options: GetPaginatedBookmarkedAlbumsOptions = Route.useSearch();
  const { data } = useQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const handleNextPage = () => {
    if (data?.furtherPages) {
      navigate({
        search: (prev: Partial<GetPaginatedBookmarkedAlbumsOptions>) => ({
          ...prev,
          page: (prev.page || 1) + 1,
        }),
      });
    }
  };

  const handlePrevPage = () => {
    navigate({
      search: (prev: Partial<GetPaginatedBookmarkedAlbumsOptions>) => {
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
      search: (prev: Partial<GetPaginatedBookmarkedAlbumsOptions>) => ({ ...prev, search }),
    });
  };

  const sortSettings: SortDropdownProps = {
    options: [
      { label: "Artist", value: "artistName" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
      { label: "Year", value: "releaseYear" },
    ],
    defaultValue: options.orderBy || "createdAt",
    defaultDirection: options.order || "desc",
    onSortChange: (value, direction) => {
      navigate({
        search: (prev: Partial<GetPaginatedBookmarkedAlbumsOptions>) => ({
          ...prev,
          orderBy: value,
          order: direction,
        }),
      });
    },
  };

  if (!data || !data.albums) return <div>Loading...</div>;
  return (
    <RequireAdmin>
      <motion.div
        key={options.page}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CardGrid
          cards={data.albums.map(album => (
            <AlbumCard key={album.spotifyID} album={album} bookmarked />
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
          }}
        />
      </motion.div>
    </RequireAdmin>
  );
}
