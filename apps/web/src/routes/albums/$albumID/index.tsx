import { useRef } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { usableCoverColours } from "@/lib/coverColours";
import { useAuth } from "@/auth/useAuth";
import { AlbumBackdrop } from "@/components/album/AlbumBackdrop";
import { AlbumInfoPanel } from "@/components/album/AlbumInfoPanel";
import { ReviewContent } from "@/components/album/ReviewContent";
import { Tracklist } from "@/components/track/Tracklist";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./index.module.css";

import type { CSSProperties } from "react";
import type { ExtractedColor } from "@shared/types";
import type { PageTheme } from "@/lib/coverColours";

async function fetchAlbumReview(albumSpotifyID: string) {
  return handle(client.api.albums[":albumID"].$get({ param: { albumID: albumSpotifyID } }));
}

const reviewQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: queryKeys.albums.detail(albumID),
    queryFn: () => fetchAlbumReview(albumID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/albums/$albumID/")({
  ssr: true,
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData(reviewQueryOptions(params.albumID));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} notFoundTitle="Album not found" notFoundDetail="This album has not been reviewed, or the link is wrong.">
      <ButtonLink to="/albums" variant="secondary">
        Back to albums
      </ButtonLink>
    </RouteError>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? socialMeta({
          title: `${loaderData.album.name} by ${loaderData.album.artistName}`,
          description: `Scored ${loaderData.album.finalScore} out of 100. Released ${loaderData.album.releaseYear}.`,
          image: loaderData.album.imageURLs[0]?.url,
        })
      : [],
  }),
});

// The backdrop has five pools, one for each colour a cover can store
const MAXIMUM_COVER_COLOURS = 5;

/**
 * Hands the page its cover colours for each theme, as --cover-light-1 to 5 and --cover-dark-1 to 5,
 * most vivid first. The page's CSS picks the set that matches the theme.
 */
function coverColourStyle(colours: ExtractedColor[]): CSSProperties {
  const themes: PageTheme[] = ["light", "dark"];
  const properties = themes.flatMap(theme => {
    const usable = usableCoverColours(colours, theme).slice(0, MAXIMUM_COVER_COLOURS);
    // A single colour fills the second pool too, so the backdrop isn't lopsided
    if (usable.length === 1) usable.push(usable[0]!);
    return usable.map((hex, index) => [`--cover-${theme}-${index + 1}`, hex]);
  });
  return Object.fromEntries(properties);
}

function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) throw new Error("albumID is undefined");

  const { data } = useSuspenseQuery(reviewQueryOptions(albumID));
  const { album, artists, tracks, albumGenres } = data;
  const { isAdmin } = useAuth();
  const panelsRef = useRef<HTMLDivElement>(null);
  const cover = album.imageURLs[0];

  return (
    <div className={styles.page} style={coverColourStyle(album.colors ?? [])}>
      <AlbumBackdrop until={panelsRef} />
      <div className={styles.links}>
        <Link to="/albums" className={styles.link}>
          <ArrowLeftIcon weight="bold" aria-hidden="true" /> Albums
        </Link>
        {isAdmin && (
          <Link to="/albums/$albumID/edit" params={{ albumID: album.spotifyID }} className={styles.link}>
            Edit
          </Link>
        )}
      </div>
      <section className={styles.showcase}>
        {cover && <img className={styles.cover} src={cover.url} alt={`${album.name} cover`} width={cover.width} height={cover.height} />}
        <div className={styles.column}>
          <div ref={panelsRef} className={styles.panels}>
            <AlbumInfoPanel album={album} artists={artists} genres={albumGenres ?? []} />
            {album.reviewContent && <ReviewContent content={album.reviewContent} />}
          </div>
          <Tracklist tracks={tracks} bestSong={album.bestSong} worstSong={album.worstSong} />
        </div>
      </section>
    </div>
  );
}
