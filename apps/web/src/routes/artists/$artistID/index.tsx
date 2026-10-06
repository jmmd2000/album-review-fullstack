import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { ArtistStanding } from "@/components/artist/ArtistStanding";
import { ScoreTimeline } from "@/components/artist/ScoreTimeline";
import { AlbumCard } from "@/components/album/AlbumCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./index.module.css";

async function fetchReviewedArtist(artistSpotifyID: string) {
  return handle(client.api.artists.details[":artistID"].$get({ param: { artistID: artistSpotifyID } }));
}

const artistQueryOptions = (artistID: string) =>
  queryOptions({
    queryKey: queryKeys.artists.detail(artistID),
    queryFn: () => fetchReviewedArtist(artistID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/artists/$artistID/")({
  ssr: true,
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData(artistQueryOptions(params.artistID));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} notFoundTitle="Artist not found" notFoundDetail="This artist has not been reviewed, or the link is wrong.">
      <ButtonLink to="/artists" variant="secondary">
        Back to artists
      </ButtonLink>
    </RouteError>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? socialMeta({
          title: loaderData.artist.name,
          description: loaderData.artist.unrated ? "Not yet rated." : `Rank #${loaderData.artist.leaderboardPosition} with a score of ${Math.ceil(loaderData.artist.totalScore)} out of 100.`,
          image: loaderData.artist.imageURLs?.[0]?.url,
        })
      : [],
  }),
});

function hasScore<T extends { finalScore: number | null }>(album: T): album is T & { finalScore: number } {
  return album.finalScore !== null;
}

function RouteComponent() {
  const { artistID } = useParams({ strict: false });
  if (!artistID) {
    throw new Error("artistID is undefined");
  }

  const { data } = useSuspenseQuery(artistQueryOptions(artistID));
  const { artist, albums, featuredAlbums, tracks, rankedArtistCount } = data;
  const ratedTrackCount = tracks.filter(track => track.rating != null && track.rating > 0).length;
  const scoredAlbumsOldestFirst = albums.filter(hasScore).reverse();

  return (
    <div className={styles.page}>
      <ArtistHeader name={artist.name} headerImage={artist.headerImage} images={artist.imageURLs} />
      <ArtistStanding artist={artist} rankedArtistCount={rankedArtistCount} albumCount={albums.length} ratedTrackCount={ratedTrackCount} />

      {scoredAlbumsOldestFirst.length > 1 && (
        <section className={styles.section}>
          <SectionHeader title="Score over time" />
          <ScoreTimeline albums={scoredAlbumsOldestFirst} />
        </section>
      )}

      <section className={styles.section}>
        <SectionHeader title="Albums" aside="Newest first" />
        <CardGrid>
          {albums.map(album => (
            <AlbumCard key={album.spotifyID} album={album} subtitle={String(album.releaseYear)} />
          ))}
        </CardGrid>
      </section>

      {featuredAlbums.length > 0 && (
        <section className={styles.section}>
          <SectionHeader title="Featured on" />
          <CardGrid>
            {featuredAlbums.map(album => (
              <AlbumCard key={album.spotifyID} album={album} />
            ))}
          </CardGrid>
        </section>
      )}
    </div>
  );
}
