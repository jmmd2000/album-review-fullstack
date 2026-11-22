import { useRef } from "react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { queryKeys } from "@/lib/queryKeys";
import { reviewShareText } from "@shared/helpers/reviewShareText";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { loadPageQuery } from "@/lib/loadPageQuery";
import { notFoundOn404 } from "@/lib/notFoundOn404";
import { coverColourStyle } from "@/lib/coverColours";
import { morphProps, preloadImage } from "@/lib/coverMorph";
import { useAuth } from "@/auth/useAuth";
import { AlbumBackdrop } from "@/components/album/AlbumBackdrop";
import { CoverHighlight } from "@/components/album/CoverHighlight";
import { CoverToolbar } from "@/components/album/CoverToolbar";
import { AlbumInfoPanel } from "@/components/album/AlbumInfoPanel";
import { ReviewContent } from "@/components/album/ReviewContent";
import { DeleteReviewDialog } from "@/components/album/DeleteReviewDialog";
import { AlbumRail } from "@/components/album/AlbumRail";
import { Tracklist } from "@/components/track/Tracklist";
import { MonthlyListening } from "@/components/listening/MonthlyListening";
import { RouteError } from "@/components/ui/RouteError";
import { NotFound } from "@/components/layout/NotFound";
import { ButtonLink } from "@/components/ui/ButtonLink";
import coverColours from "@/styles/coverColours.module.css";
import styles from "./index.module.css";

async function fetchAlbumReview(albumSpotifyID: string) {
  return handle(client.api.albums[":albumID"].$get({ param: { albumID: albumSpotifyID }, query: {} }));
}

const reviewQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: queryKeys.albums.detail(albumID),
    queryFn: () => fetchAlbumReview(albumID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

const relatedQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: queryKeys.albums.related(albumID),
    queryFn: () => handle(client.api.albums[":albumID"].related.$get({ param: { albumID } })),
  });

export const Route = createFileRoute("/albums/$albumID/")({
  ssr: true,
  loader: async ({ params, context }) => {
    const [review] = await Promise.all([
      notFoundOn404(loadPageQuery(context.queryClient, reviewQueryOptions(params.albumID))),
      loadPageQuery(context.queryClient, relatedQueryOptions(params.albumID)),
    ]);
    await preloadImage(review.album.imageURLs[0]?.url);
    return review;
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <NotFound kind="album" title="Album not found" detail="This album has not been reviewed, or the link is wrong.">
      <ButtonLink to="/albums" variant="secondary">
        Back to albums
      </ButtonLink>
    </NotFound>
  ),
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset}>
      <ButtonLink to="/albums" variant="secondary">
        Back to albums
      </ButtonLink>
    </RouteError>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? socialMeta({
          title: `${loaderData.album.name} by ${loaderData.album.artistName}`,
          description: reviewShareText(loaderData.album.reviewContent ?? "") || `Scored ${loaderData.album.finalScore} out of 100. Released ${loaderData.album.releaseYear}.`,
          image: loaderData.album.imageURLs[0]?.url,
        })
      : [],
  }),
});

function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) throw new Error("albumID is undefined");

  const { data } = useSuspenseQuery(reviewQueryOptions(albumID));
  const { album, artists, tracks, albumGenres, linkedAlbums } = data;
  const { data: related } = useSuspenseQuery(relatedQueryOptions(albumID));
  const { isAdmin } = useAuth();
  const panelsRef = useRef<HTMLDivElement>(null);
  const cover = album.imageURLs[0];
  // Only the admin's listening shows, so visitors never ask for it
  const listening = useQuery({
    queryKey: queryKeys.listening.album(albumID),
    queryFn: () => handle(client.api.listening.album[":albumID"].$get({ param: { albumID } })),
    enabled: isAdmin,
  });
  const plays = listening.data ?? null;

  return (
    <div className={`${coverColours.coverColours} ${styles.page}`} style={coverColourStyle(album.colors ?? [])}>
      <AlbumBackdrop until={panelsRef} />
      <CoverHighlight colours={album.colors ?? []} />
      <CoverToolbar colours={album.colors ?? []} />
      <div className={styles.links}>
        <Link to="/albums" className={styles.link}>
          <ArrowLeftIcon weight="bold" aria-hidden="true" /> Albums
        </Link>
        {isAdmin && (
          <div className={styles.adminLinks}>
            <Link to="/albums/$albumID/edit" params={{ albumID: album.spotifyID }} className={styles.link}>
              Edit
            </Link>
            <DeleteReviewDialog albumID={album.spotifyID} albumName={album.name} triggerClassName={styles.link} />
          </div>
        )}
      </div>
      <section className={styles.showcase}>
        {cover && <img className={styles.cover} src={cover.url} alt={`${album.name} cover`} width={cover.width} height={cover.height} {...morphProps("album", album.spotifyID)} />}
        <div className={styles.column}>
          <div ref={panelsRef} className={styles.panels}>
            <AlbumInfoPanel album={album} artists={artists} genres={albumGenres ?? []} listening={isAdmin ? { plays: plays?.plays ?? null, firstPlayedAt: plays?.firstPlayedAt ?? null } : undefined} />
            {album.reviewContent && <ReviewContent content={album.reviewContent} linkedAlbums={linkedAlbums} />}
          </div>
          <Tracklist tracks={tracks} plays={isAdmin ? (plays?.trackPlays ?? null) : undefined} />
        </div>
      </section>
      <div className={styles.listening}>
        {isAdmin && listening.isPending && <MonthlyListening months={null} />}
        {plays && plays.months.length > 0 && <MonthlyListening months={plays.months} />}
        {listening.isError && (
          <p className={styles.error} role="alert">
            Your listening couldn't load. {listening.error.message}
          </p>
        )}
      </div>
      <AlbumRail
        title={`More from ${album.artistName}`}
        albums={related.moreByArtist}
        link={
          <Link to="/artists/$artistID" params={{ artistID: album.artistSpotifyID }} className={styles.link}>
            Artist page
          </Link>
        }
      />
      <AlbumRail title="Similar albums" albums={related.similar} />
    </div>
  );
}
