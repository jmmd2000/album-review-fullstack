import { useState } from "react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { loadPageQuery } from "@/lib/loadPageQuery";
import { notFoundOn404 } from "@/lib/notFoundOn404";
import { preloadImage } from "@/lib/coverMorph";
import { useAuth } from "@/auth/useAuth";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { HeaderImageDialog } from "@/components/artist/HeaderImageDialog";
import { ArtistStanding } from "@/components/artist/ArtistStanding";
import { ScoreTimeline } from "@/components/artist/ScoreTimeline";
import { ArtistListening } from "@/components/artist/ArtistListening";
import { TracksByPlays } from "@/components/artist/TracksByPlays";
import { OptionSwitch } from "@/components/ui/OptionSwitch";
import { describePlays } from "@/lib/listening";
import { TracksByRating } from "@/components/artist/TracksByRating";
import { AlbumCard } from "@/components/album/AlbumCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RouteError } from "@/components/ui/RouteError";
import { NotFound } from "@/components/layout/NotFound";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./index.module.css";

type TrackSort = "rating" | "plays";
type AlbumSort = "newest" | "plays";

const TRACK_SORTS: { value: TrackSort; label: string }[] = [
  { value: "rating", label: "Rating" },
  { value: "plays", label: "Most played" },
];
const ALBUM_SORTS: { value: AlbumSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "plays", label: "Most played" },
];

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
    const details = await notFoundOn404(loadPageQuery(context.queryClient, artistQueryOptions(params.artistID)));
    await preloadImage(details.artist.imageURLs[0]?.url);
    return details;
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <NotFound kind="artist" title="Artist not found" detail="This artist has not been reviewed, or the link is wrong.">
      <ButtonLink to="/artists" variant="secondary">
        Back to artists
      </ButtonLink>
    </NotFound>
  ),
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset}>
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

function RouteComponent() {
  const { artistID } = useParams({ strict: false });
  if (!artistID) {
    throw new Error("artistID is undefined");
  }

  const { data } = useSuspenseQuery(artistQueryOptions(artistID));
  const { artist, albums, featuredAlbums, tracks, rankedArtistCount } = data;
  const { isAdmin } = useAuth();
  // Only the admin's listening shows, so visitors never ask for it
  const listening = useQuery({
    queryKey: queryKeys.listening.artist(artistID),
    queryFn: () => handle(client.api.listening.artist[":artistID"].$get({ param: { artistID } })),
    enabled: isAdmin,
  });
  const [trackSort, setTrackSort] = useState<TrackSort>("rating");
  const [albumSort, setAlbumSort] = useState<AlbumSort>("newest");
  // The admin sees the switches straight away. They show a sort by plays only once the listening has loaded, as the lists do.
  const plays = listening.data ?? null;
  const showTrackPlays = plays !== null && trackSort === "plays";
  const showAlbumPlays = plays !== null && albumSort === "plays";
  const albumsShown = showAlbumPlays ? [...albums].sort((first, second) => (plays.albumPlays[second.spotifyID] ?? 0) - (plays.albumPlays[first.spotifyID] ?? 0)) : albums;
  const ratedTrackCount = tracks.filter(track => (track.rating ?? 0) > 0).length;
  const albumsOldestFirst = [...albums].reverse();

  return (
    <div className={styles.page}>
      <ArtistHeader
        artistID={artist.spotifyID}
        name={artist.name}
        headerImage={artist.headerImage}
        images={artist.imageURLs}
        actions={isAdmin && <HeaderImageDialog artistID={artist.spotifyID} headerImage={artist.headerImage} />}
      />
      <ArtistStanding
        artist={artist}
        rankedArtistCount={rankedArtistCount}
        albumCount={albums.length}
        ratedTrackCount={ratedTrackCount}
        listening={isAdmin ? { plays: plays?.plays ?? null, firstPlayedAt: plays?.firstPlayedAt ?? null } : undefined}
      />

      {albumsOldestFirst.length > 1 && (
        <section className={styles.section}>
          <SectionHeader title="Score over time" />
          <ScoreTimeline albums={albumsOldestFirst} />
        </section>
      )}

      {isAdmin && listening.isPending && <ArtistListening months={null} />}
      {listening.data && listening.data.months.length > 0 && <ArtistListening months={listening.data.months} />}
      {listening.isError && (
        <section className={styles.section}>
          <SectionHeader title="Listening" />
          <p className={styles.error} role="alert">
            Your listening couldn't load. {listening.error.message}
          </p>
        </section>
      )}

      {ratedTrackCount > 0 && (
        <section className={styles.section}>
          <SectionHeader
            title={showTrackPlays ? "Tracks sorted by plays" : "Tracks sorted by rating"}
            link={isAdmin && <OptionSwitch label="Sort tracks by" options={TRACK_SORTS} value={showTrackPlays ? "plays" : "rating"} onChange={setTrackSort} />}
          />
          {showTrackPlays ? <TracksByPlays tracks={tracks} plays={plays.trackPlays} artistName={artist.name} /> : <TracksByRating tracks={tracks} artistName={artist.name} />}
        </section>
      )}

      <section className={styles.section}>
        <SectionHeader
          title="Albums"
          aside={isAdmin ? undefined : "Newest first"}
          link={isAdmin && <OptionSwitch label="Sort albums by" options={ALBUM_SORTS} value={showAlbumPlays ? "plays" : "newest"} onChange={setAlbumSort} />}
        />
        <CardGrid>
          {albumsShown.map(album => (
            <AlbumCard key={album.spotifyID} album={album} subtitle={showAlbumPlays ? describePlays(plays.albumPlays[album.spotifyID] ?? 0) : String(album.releaseYear)} />
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
