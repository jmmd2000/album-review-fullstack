import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { useListControls } from "@/hooks/useListControls";
import { AlbumCard } from "@/components/album/AlbumCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { SortSelect } from "@/components/ui/SortSelect";
import { GenreSelect } from "@/components/ui/GenreSelect";
import { SearchForm } from "@/components/ui/SearchForm";

import type { GetPaginatedAlbumsOptions } from "@shared/types";
import type { SortOption } from "@/components/ui/SortSelect";

const sortOptions: SortOption[] = [
  { label: "Date Added", value: "createdAt" },
  { label: "Score", value: "finalScore" },
  { label: "Release Year", value: "releaseYear" },
  { label: "Name", value: "name" },
];

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

    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "createdAt") delete result.orderBy;
    if (result.order === "desc") delete result.order;
    if (genres.length === 0) delete result.genres;
    if (!result.secondaryOrderBy) delete result.secondaryOrderBy;
    if (!result.secondaryOrder) delete result.secondaryOrder;

    return result;
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    return context.queryClient.ensureQueryData(albumQueryOptions(deps));
  },
  component: RouteComponent,
  pendingComponent: () => (
    <>
      <PageHeader title="Albums" />
      <CardGridSkeleton />
    </>
  ),
  errorComponent: () => (
    <>
      <PageHeader title="Albums" />
      <PageState title="Something went wrong" detail="The albums page could not be loaded. Try refreshing the page." />
    </>
  ),
  head: () => ({
    meta: socialMeta({
      title: "Albums",
      description: "Every album I have reviewed, scored out of 100.",
    }),
  }),
});

function RouteComponent() {
  const options: GetPaginatedAlbumsOptions = Route.useSearch();
  const { data } = useSuspenseQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search, pagination } = useListControls<GetPaginatedAlbumsOptions>({ page: options.page, data, navigate });

  const orderBy = options.orderBy ?? "createdAt";
  const order = options.order ?? "desc";

  return (
    <>
      <PageHeader title="Albums" eyebrow={`${data.totalCount} reviewed`}>
        <SearchForm label="Search albums" defaultValue={options.search ?? ""} onSearch={search} />
        <div style={{ display: "flex", gap: 8 }}>
          <SortSelect
            options={sortOptions}
            value={orderBy}
            direction={order}
            onSortChange={(value, direction) => {
              navigate({
                search: prev => ({
                  ...prev,
                  orderBy: value as GetPaginatedAlbumsOptions["orderBy"],
                  order: direction,
                  page: undefined,
                }),
              });
            }}
          />
          <GenreSelect
            genres={data.genres}
            relatedGenres={data.relatedGenres}
            selected={options.genres ?? []}
            onChange={slugs => {
              navigate({
                search: prev => ({
                  ...prev,
                  genres: slugs.length > 0 ? slugs : undefined,
                  page: undefined,
                }),
              });
            }}
          />
        </div>
      </PageHeader>
      {data.albums.length === 0 ? (
        <PageState title="No albums found" detail="Try a different search, or clear your filters." />
      ) : (
        <>
          <CardGrid>
            {data.albums.map(album => (
              <AlbumCard key={album.spotifyID} album={album} />
            ))}
          </CardGrid>
          <Pagination pagination={pagination} />
        </>
      )}
    </>
  );
}
