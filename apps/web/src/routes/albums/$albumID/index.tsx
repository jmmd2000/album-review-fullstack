import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { useAuth } from "@/auth/useAuth";
import { AlbumHero } from "@/components/album/AlbumHero";
import { AlbumInfo } from "@/components/album/AlbumInfo";
import { ReviewContent } from "@/components/album/ReviewContent";
import { Tracklist } from "@/components/track/Tracklist";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./index.module.css";

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

function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) throw new Error("albumID is undefined");

  const { data } = useSuspenseQuery(reviewQueryOptions(albumID));
  const { album, artists, tracks, albumGenres } = data;
  const { isAdmin } = useAuth();

  return (
    <>
      <AlbumHero album={album} artists={artists} genres={albumGenres ?? []} canEdit={isAdmin} />
      <AlbumInfo releaseDate={album.releaseDate} runtime={album.runtime} trackCount={tracks.length} reviewed={album.createdAt} affectsArtistScore={album.affectsArtistScore} />
      <div className={styles.column}>
        {album.reviewContent && <ReviewContent content={album.reviewContent} />}
        <Tracklist tracks={tracks} bestSong={album.bestSong} worstSong={album.worstSong} />
      </div>
    </>
  );
}
