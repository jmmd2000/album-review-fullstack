import { infiniteQueryOptions, queryOptions, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { albumIDFromLink } from "@/lib/spotifyLink";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { AlbumCard } from "@/components/album/AlbumCard";
import { BookmarkButton } from "@/components/album/BookmarkButton";
import { DismissButton } from "@/components/album/DismissButton";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageState } from "@/components/ui/PageState";
import { SearchForm } from "@/components/ui/SearchForm";
import { RouteError } from "@/components/ui/RouteError";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./index.module.css";

const defaultSearch = { query: "" } as const;

const searchSchema = z.object({
  query: z.coerce.string().default(defaultSearch.query).catch(defaultSearch.query),
});

const searchQueryOptions = (query: string) =>
  infiniteQueryOptions({
    queryKey: queryKeys.search.results({ query }),
    queryFn: ({ pageParam }) => handle(client.api.spotify.albums.search.$get({ query: { query, offset: String(pageParam) } })),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.nextOffset ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

const discoverQueryOptions = queryOptions({
  queryKey: queryKeys.discover,
  queryFn: () => handle(client.api.discover.$get()),
});

export const Route = createFileRoute("/search/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => ({ query: search.query }),
  loader: async ({ deps, context }) => {
    if (deps.query) await context.queryClient.prefetchInfiniteQuery(searchQueryOptions(deps.query));
    else await context.queryClient.prefetchQuery(discoverQueryOptions);
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

  function search(value: string) {
    const albumID = albumIDFromLink(value);
    if (albumID) {
      void navigate({ to: "/albums/$albumID/create", params: { albumID } });
      return;
    }
    void navigate({ search: { query: value } });
  }

  return (
    <>
      <PageHeader title="Review an album">
        <SearchForm label="Search Spotify albums" defaultValue={query} placeholder="Album, artist or Spotify link" onSearch={search} />
      </PageHeader>
      {query ? <SearchResults query={query} /> : <Discover />}
    </>
  );
}

/** The rows that help pick the next album, or the empty state when every row is empty. */
function Discover() {
  const { data } = useSuspenseQuery(discoverQueryOptions);

  if (data.newAlbums.length === 0 && data.picked.length === 0 && data.upNext.length === 0) {
    return (
      <PageState title="Find an album on Spotify" detail="Search for an album or an artist. Pick a result to review it, or bookmark it for later.">
        <ButtonLink to="/bookmarks" variant="secondary">
          Bookmarks
        </ButtonLink>
      </PageState>
    );
  }

  return (
    <>
      {data.newAlbums.length > 0 && (
        <section className={styles.row}>
          <SectionHeader title="New from artists you've reviewed" />
          <CardGrid>
            {data.newAlbums.map(album => (
              <AlbumCard key={album.spotifyID} album={album} action={<BookmarkButton album={album} bookmarked={false} />} />
            ))}
          </CardGrid>
        </section>
      )}
      {data.picked.length > 0 && (
        <section className={styles.row}>
          <SectionHeader title="Picked for you" />
          <CardGrid>
            {data.picked.map(album => (
              <AlbumCard
                key={album.spotifyID}
                album={album}
                action={
                  <div className={styles.actions}>
                    <BookmarkButton album={album} bookmarked={false} />
                    <DismissButton album={album} />
                  </div>
                }
              />
            ))}
          </CardGrid>
        </section>
      )}
      {data.upNext.length > 0 && (
        <section className={styles.row}>
          <SectionHeader title="Up next" link={<Link to="/bookmarks">All bookmarks</Link>} />
          <CardGrid>
            {data.upNext.map(album => (
              <AlbumCard key={album.spotifyID} album={album} action={<BookmarkButton album={album} bookmarked />} />
            ))}
          </CardGrid>
        </section>
      )}
    </>
  );
}

function SearchResults({ query }: { query: string }) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(searchQueryOptions(query));
  const albums = data.pages.flatMap(page => page.albums);

  if (albums.length === 0) return <PageState title="Nothing on Spotify matches that" detail="Check the spelling, or search for the artist instead." />;

  return (
    <>
      <CardGrid>
        {albums.map(album => (
          <AlbumCard
            key={album.spotifyID}
            album={album}
            subtitle={`${album.artistName} · ${album.releaseYear} · ${releaseTypeName(album.releaseType)}`}
            action={album.finalScore === null ? <BookmarkButton album={album} bookmarked={album.bookmarked ?? false} /> : undefined}
          />
        ))}
      </CardGrid>
      {hasNextPage && (
        <div className={styles.more}>
          <Button onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}

function releaseTypeName(releaseType: string) {
  return releaseType.charAt(0).toUpperCase() + releaseType.slice(1);
}
