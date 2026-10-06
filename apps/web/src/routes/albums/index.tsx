import { Fragment } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { groupBySeparator, letterSeparator, scoreSeparator, yearSeparator } from "@/lib/separators";
import { useListControls } from "@/hooks/useListControls";
import { AlbumCard } from "@/components/album/AlbumCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { SortTabs } from "@/components/ui/SortTabs";
import { GenreSelect } from "@/components/ui/GenreSelect";
import { SearchForm } from "@/components/ui/SearchForm";
import { RouteError } from "@/components/ui/RouteError";
import { Checkbox } from "@/components/ui/Checkbox";
import { SeparatorTile } from "@/components/ui/SeparatorTile";

import type { DisplayAlbum, GetPaginatedAlbumsOptions } from "@shared/types";
import type { Separator } from "@/lib/separators";
import type { SortOption } from "@/components/ui/SortTabs";

interface AlbumsSearch extends GetPaginatedAlbumsOptions {
  /** "off" hides the separator tiles. It only changes the page, so it isn't sent to the API */
  groups?: "off";
}

const sortOptions: SortOption[] = [
  { label: "Newest", value: "createdAt", direction: "desc" },
  { label: "Score", value: "finalScore", direction: "desc" },
  { label: "Released", value: "releaseYear", direction: "desc" },
  { label: "Name", value: "name", direction: "asc" },
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
  validateSearch: (search: Record<string, unknown>): AlbumsSearch => {
    const rawGenres = search.genres;
    const genres = Array.isArray(rawGenres) ? (rawGenres as string[]) : typeof rawGenres === "string" && rawGenres !== "" ? rawGenres.split(",") : [];

    const result: AlbumsSearch = {
      page: Number(search.page) || 1,
      search: (search.search as string) || "",
      orderBy: (search.orderBy as GetPaginatedAlbumsOptions["orderBy"]) || "createdAt",
      order: (search.order as GetPaginatedAlbumsOptions["order"]) || "desc",
      genres,
      secondaryOrderBy: search.secondaryOrderBy as GetPaginatedAlbumsOptions["secondaryOrderBy"],
      secondaryOrder: search.secondaryOrder as GetPaginatedAlbumsOptions["secondaryOrder"],
      groups: search.groups === "off" ? "off" : undefined,
    };

    if (result.page === 1) delete result.page;
    if (result.search === "") delete result.search;
    if (result.orderBy === "createdAt") delete result.orderBy;
    if (result.order === "desc") delete result.order;
    if (genres.length === 0) delete result.genres;
    if (!result.secondaryOrderBy) delete result.secondaryOrderBy;
    if (!result.secondaryOrder) delete result.secondaryOrder;
    if (!result.groups) delete result.groups;

    return result;
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
    genres: search.genres,
    secondaryOrderBy: search.secondaryOrderBy,
    secondaryOrder: search.secondaryOrder,
  }),
  loader: async ({ deps, context }) => {
    return context.queryClient.ensureQueryData(albumQueryOptions(deps));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
  head: () => ({
    meta: socialMeta({
      title: "Albums",
      description: "Every album I have reviewed, scored out of 100.",
    }),
  }),
});

// Newest first isn't grouped, since months would break it up every few covers
function isGroupedSort(orderBy: GetPaginatedAlbumsOptions["orderBy"]): boolean {
  return orderBy === "finalScore" || orderBy === "releaseYear" || orderBy === "name";
}

function albumSeparator(album: DisplayAlbum, orderBy: GetPaginatedAlbumsOptions["orderBy"]): Separator | null {
  switch (orderBy) {
    case "finalScore":
      return scoreSeparator(album.finalScore);
    case "releaseYear":
      return yearSeparator(album.releaseYear);
    case "name":
      return letterSeparator(album.name);
    default:
      return null;
  }
}

function RouteComponent() {
  const options = Route.useSearch();
  const { data } = useSuspenseQuery(albumQueryOptions(Route.useLoaderDeps()));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search } = useListControls<GetPaginatedAlbumsOptions>({ navigate });

  const orderBy = options.orderBy ?? "createdAt";
  const order = options.order ?? "desc";
  const showTiles = isGroupedSort(orderBy) && options.groups !== "off";

  return (
    <>
      <PageHeader title="Albums" count={data.totalCount}>
        <SearchForm label="Search albums" defaultValue={options.search ?? ""} onSearch={search} />
        <SortTabs
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
        {isGroupedSort(orderBy) && <Checkbox label="Groups" checked={showTiles} onChange={checked => navigate({ search: prev => ({ ...prev, groups: checked ? undefined : "off" }) })} />}
        <GenreSelect
          genres={data.genres}
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
      </PageHeader>
      {data.albums.length === 0 ? (
        <PageState title="No albums found" detail="Try a different search, or clear your filters." />
      ) : (
        <>
          <CardGrid>
            {groupBySeparator(data.albums, album => (showTiles ? albumSeparator(album, orderBy) : null)).map((group, index) => (
              <Fragment key={index}>
                {group.separator && <SeparatorTile {...group.separator} />}
                {group.items.map(album => (
                  <AlbumCard key={album.spotifyID} album={album} />
                ))}
              </Fragment>
            ))}
          </CardGrid>
          <Pagination page={options.page ?? 1} totalCount={data.totalCount} />
        </>
      )}
    </>
  );
}
