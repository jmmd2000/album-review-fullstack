import { Fragment } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

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

// Values left at these stay out of the URL
const defaultSearch = { page: 1, search: "", orderBy: "createdAt", order: "desc", genres: "", groups: "on" } as const;

/** The URL's search params. A missing or invalid value falls back to its default rather than reaching the API */
const albumsSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(defaultSearch.page).catch(defaultSearch.page),
  search: z.coerce.string().default(defaultSearch.search).catch(defaultSearch.search),
  orderBy: z.enum(["createdAt", "finalScore", "releaseYear", "name"]).default(defaultSearch.orderBy).catch(defaultSearch.orderBy),
  order: z.enum(["asc", "desc"]).default(defaultSearch.order).catch(defaultSearch.order),
  // Genre slugs joined with commas. Older links wrote them as an array, so that's read too
  genres: z
    .preprocess(value => (Array.isArray(value) ? value.join(",") : value), z.string())
    .default(defaultSearch.genres)
    .catch(defaultSearch.genres),
  // "off" hides the separator tiles. It only changes the page, so it isn't sent to the API
  groups: z.enum(["on", "off"]).default(defaultSearch.groups).catch(defaultSearch.groups),
});

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
  validateSearch: albumsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
    genres: search.genres === "" ? [] : search.genres.split(","),
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
  const deps = Route.useLoaderDeps();
  const { data } = useSuspenseQuery(albumQueryOptions(deps));
  const navigate = useNavigate({ from: Route.fullPath });

  const { search } = useListControls({ navigate });

  const { orderBy, order } = options;
  const showTiles = isGroupedSort(orderBy) && options.groups === "on";

  return (
    <>
      <PageHeader title="Albums" count={data.totalCount}>
        <SearchForm label="Search albums" defaultValue={options.search} onSearch={search} />
        <SortTabs
          options={sortOptions}
          value={orderBy}
          direction={order}
          onSortChange={(value, direction) => {
            navigate({
              search: prev => ({
                ...prev,
                orderBy: value as typeof orderBy,
                order: direction,
                page: undefined,
              }),
            });
          }}
        />
        {isGroupedSort(orderBy) && <Checkbox label="Groups" checked={showTiles} onChange={checked => navigate({ search: prev => ({ ...prev, groups: checked ? "on" : "off" }) })} />}
        <GenreSelect
          genres={data.genres}
          selected={deps.genres}
          onChange={slugs => {
            navigate({
              search: prev => ({
                ...prev,
                genres: slugs.join(","),
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
          <Pagination page={options.page} totalCount={data.totalCount} />
        </>
      )}
    </>
  );
}
