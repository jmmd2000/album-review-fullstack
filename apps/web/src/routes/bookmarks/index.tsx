import { motion } from "framer-motion";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { client, handle } from "@/lib/client";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import CardGrid from "@/components/ui/CardGrid";
import AlbumCard from "@/components/album/AlbumCard";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import type { SortDropdownProps } from "@/components/ui/SortDropdown";

import type { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { PAGE_SIZE } from "@shared/constants";

async function fetchPaginatedBookmarkedAlbums(options: GetPaginatedBookmarkedAlbumsOptions) {
  return handle(
    client.api.bookmarks.$get({
      query: {
        ...(options.page ? { page: String(options.page) } : {}),
        ...(options.order ? { order: options.order } : {}),
        ...(options.orderBy ? { orderBy: options.orderBy } : {}),
        ...(options.search ? { search: options.search } : {}),
      },
    })
  );
}

const albumQueryOptions = (options: GetPaginatedBookmarkedAlbumsOptions) =>
  queryOptions({
    queryKey: queryKeys.bookmarks.list(options),
    queryFn: () => fetchPaginatedBookmarkedAlbums(options),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/bookmarks/")({
  validateSearch: (search: Record<string, unknown>): GetPaginatedBookmarkedAlbumsOptions => {
    const result: GetPaginatedBookmarkedAlbumsOptions = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy: (search.orderBy as GetPaginatedBookmarkedAlbumsOptions["orderBy"]) || "createdAt",
      order: (search.order as GetPaginatedBookmarkedAlbumsOptions["order"]) || "desc",
    };

    // Only include non-default values in the URL
    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "createdAt") delete result.orderBy;
    if (result.order === "desc") delete result.order;

    return result;
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return queryClient.ensureQueryData(albumQueryOptions(deps));
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
          orderBy: value as GetPaginatedBookmarkedAlbumsOptions["orderBy"],
          order: direction,
        }),
      });
    },
  };

  if (!data || !data.albums) return <div>Loading...</div>;
  return (
    <RequireAdmin>
      <motion.div key={options.page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
                totalPages: Math.ceil(data.totalCount / PAGE_SIZE),
              },
            },
            sortSettings: sortSettings,
          }}
        />
      </motion.div>
    </RequireAdmin>
  );
}
