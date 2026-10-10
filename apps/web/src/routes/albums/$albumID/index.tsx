import { useRef } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
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
import { Tracklist } from "@/components/track/Tracklist";
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

export const Route = createFileRoute("/albums/$albumID/")({
  ssr: true,
  loader: async ({ params, context }) => {
    const review = await notFoundOn404(context.queryClient.ensureQueryData(reviewQueryOptions(params.albumID)));
    await preloadImage(review.album.imageURLs[0]?.url);
    return review;
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <NotFound title="Album not found" detail="This album has not been reviewed, or the link is wrong.">
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
          description: `Scored ${loaderData.album.finalScore} out of 100. Released ${loaderData.album.releaseYear}.`,
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
  const { isAdmin } = useAuth();
  const panelsRef = useRef<HTMLDivElement>(null);
  const cover = album.imageURLs[0];

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
            <AlbumInfoPanel album={album} artists={artists} genres={albumGenres ?? []} />
            {album.reviewContent && <ReviewContent content={album.reviewContent} linkedAlbums={linkedAlbums} />}
          </div>
          <Tracklist tracks={tracks} />
        </div>
      </section>
    </div>
  );
}
