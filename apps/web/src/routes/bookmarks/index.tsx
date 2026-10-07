import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { useListControls } from "@/hooks/useListControls";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { AlbumCard } from "@/components/album/AlbumCard";
import { BookmarkButton } from "@/components/album/BookmarkButton";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchForm } from "@/components/ui/SearchForm";
import { SortTabs } from "@/components/ui/SortTabs";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";

import type { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import type { SortOption } from "@/components/ui/SortTabs";

// Values left at these stay out of the URL
const defaultSearch = { page: 1, search: "", orderBy: "createdAt", order: "desc" } as const;

const bookmarksSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(defaultSearch.page).catch(defaultSearch.page),
  search: z.coerce.string().default(defaultSearch.search).catch(defaultSearch.search),
  orderBy: z.enum(["createdAt", "artistName", "name", "releaseYear"]).default(defaultSearch.orderBy).catch(defaultSearch.orderBy),
  order: z.enum(["asc", "desc"]).default(defaultSearch.order).catch(defaultSearch.order),
});

const sortOptions: SortOption[] = [
  { label: "Added", value: "createdAt", direction: "desc" },
  { label: "Artist", value: "artistName", direction: "asc" },
  { label: "Name", value: "name", direction: "asc" },
  { label: "Released", value: "releaseYear", direction: "desc" },
];

const bookmarksQueryOptions = (options: GetPaginatedBookmarkedAlbumsOptions) =>
  queryOptions({
    queryKey: queryKeys.bookmarks.list(options),
    queryFn: () =>
      handle(
        client.api.bookmarks.$get({
          query: {
            ...(options.page ? { page: String(options.page) } : {}),
            ...(options.order ? { order: options.order } : {}),
            ...(options.orderBy ? { orderBy: options.orderBy } : {}),
            ...(options.search ? { search: options.search } : {}),
          },
        })
      ),
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/bookmarks/")({
  validateSearch: bookmarksSearchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => search,
  // Prefetch, because it doesn't throw. The list needs admin, and visitors should see the log in note, not an error
  loader: async ({ deps, context }) => {
    await context.queryClient.prefetchQuery(bookmarksQueryOptions(deps));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
  head: () => ({
    meta: [{ title: "Bookmarks" }],
  }),
});

function RouteComponent() {
  return (
    <AdminOnly>
      <Bookmarks />
    </AdminOnly>
  );
}

function Bookmarks() {
  const options = Route.useSearch();
  const { data } = useSuspenseQuery(bookmarksQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });
  const { search } = useListControls({ navigate });

  return (
    <>
      <PageHeader title="Bookmarks" count={data.totalCount}>
        <SearchForm label="Search bookmarks" defaultValue={options.search} onSearch={search} />
        <SortTabs
          options={sortOptions}
          value={options.orderBy}
          direction={options.order}
          onSortChange={(value, direction) => {
            navigate({
              search: prev => ({
                ...prev,
                orderBy: value as typeof options.orderBy,
                order: direction,
                page: undefined,
              }),
            });
          }}
        />
      </PageHeader>
      {data.albums.length === 0 ? (
        options.search ? (
          <PageState title="No bookmarks match that" detail="Try a different search." />
        ) : (
          <PageState title="Nothing bookmarked yet" detail="Bookmark albums from the search to review them later.">
            <ButtonLink to="/search" variant="secondary">
              Find an album
            </ButtonLink>
          </PageState>
        )
      ) : (
        <>
          <CardGrid>
            {data.albums.map(album => (
              <AlbumCard key={album.spotifyID} album={album} action={<BookmarkButton album={album} bookmarked />} />
            ))}
          </CardGrid>
          <Pagination page={options.page} totalCount={data.totalCount} />
        </>
      )}
    </>
  );
}
