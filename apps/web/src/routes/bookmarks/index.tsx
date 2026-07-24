import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { useListControls } from "@/hooks/useListControls";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import CardGrid from "@/components/ui/CardGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import AlbumCard from "@/components/album/AlbumCard";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import type { SortDropdownProps } from "@/components/ui/SortDropdown";

import type { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";

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
  loader: async ({ deps, context }) => {
    return context.queryClient.ensureQueryData(albumQueryOptions(deps));
  },
  component: RouteComponent,
  pendingComponent: () => <Skeleton variant="grid" />,
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
  const { data } = useSuspenseQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedBookmarkedAlbumsOptions>({ page: options.page, data, navigate });

  const sortSettings: SortDropdownProps = {
    options: [
      { label: "Artist", value: "artistName" },
      { label: "Name", value: "name" },
      { label: "Date Added", value: "createdAt" },
      { label: "Year", value: "releaseYear" },
    ],
    value: options.orderBy || "createdAt",
    direction: options.order || "desc",
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

  return (
    <RequireAdmin>
      <ListPageLayout page={options.page}>
        <CardGrid
          cards={data.albums.map(album => (
            <AlbumCard key={album.spotifyID} album={album} bookmarked />
          ))}
          counter={data.totalCount}
          controls={{ search, pagination, sortSettings }}
        />
      </ListPageLayout>
    </RequireAdmin>
  );
}
