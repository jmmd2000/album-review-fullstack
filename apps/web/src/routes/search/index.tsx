import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { AlbumCard } from "@/components/album/AlbumCard";
import { BookmarkButton } from "@/components/album/BookmarkButton";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { SearchForm } from "@/components/ui/SearchForm";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";

const defaultSearch = { query: "" } as const;

const searchSchema = z.object({
  query: z.coerce.string().default(defaultSearch.query).catch(defaultSearch.query),
});

const searchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: queryKeys.search.results({ query }),
    queryFn: () => handle(client.api.spotify.albums.search.$get({ query: { query } })),
    staleTime: 1000 * 60 * 5,
  });

export const Route = createFileRoute("/search/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => ({ query: search.query }),
  loader: async ({ deps, context }) => {
    if (deps.query) await context.queryClient.prefetchQuery(searchQueryOptions(deps.query));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => <RouteError error={error} reset={reset} />,
  head: () => ({
    meta: [{ title: "Review an album" }],
  }),
});

function RouteComponent() {
  return (
    <AdminOnly>
      <SearchPage />
    </AdminOnly>
  );
}

function SearchPage() {
  const { query } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <>
      <PageHeader title="Review an album">
        <SearchForm label="Search Spotify albums" defaultValue={query} onSearch={value => void navigate({ search: { query: value } })} />
      </PageHeader>
      {query ? (
        <SearchResults query={query} />
      ) : (
        <PageState title="Find an album on Spotify" detail="Search for an album or an artist. Pick a result to review it, or bookmark it for later.">
          <ButtonLink to="/bookmarks" variant="secondary">
            Bookmarks
          </ButtonLink>
        </PageState>
      )}
    </>
  );
}

function SearchResults({ query }: { query: string }) {
  const { data: albums } = useSuspenseQuery(searchQueryOptions(query));

  if (albums.length === 0) return <PageState title="Nothing on Spotify matches that" detail="Check the spelling, or search for the artist instead." />;

  return (
    <CardGrid>
      {albums.map(album => (
        <AlbumCard
          key={album.spotifyID}
          album={album}
          subtitle={`${album.artistName} · ${album.releaseYear}`}
          action={album.finalScore === null ? <BookmarkButton album={album} bookmarked={album.bookmarked ?? false} /> : undefined}
        />
      ))}
    </CardGrid>
  );
}
