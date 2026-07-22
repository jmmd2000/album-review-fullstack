import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import BlurryHeader from "@components/layout/BlurryHeader";
import ErrorComponent from "@components/ui/ErrorComponent";
import TrackList from "@components/track/TrackList";
import AlbumDetails from "@components/album/AlbumDetails";
import ReviewDetails from "@components/album/ReviewDetails";
import GenrePills from "@/components/ui/GenrePills";
import HeaderDetails from "@/components/layout/HeaderDetails";
import { useEffect } from "react";
import { client, handle } from "@/lib/client";

async function fetchAlbumReview(albumSpotifyID: string) {
  return handle(client.api.albums[":albumID"].$get({ param: { albumID: albumSpotifyID } }));
}

const reviewQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: ["albumReview", albumID],
    queryFn: () => fetchAlbumReview(albumID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/albums/$albumID/")({
  loader: async ({ params }) => {
    return queryClient.ensureQueryData(reviewQueryOptions(params.albumID));
  },
  errorComponent: ErrorComponent,
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.album?.name,
      },
    ],
  }),
});

/**
 *  This is the album detail page
 *  It displays an album reviews contents along with the rated tracks in TrackCards
 */
function RouteComponent() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const { albumID } = useParams({ strict: false });
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  const {
    data: { album, artists, tracks, albumGenres },
  } = useSuspenseQuery(reviewQueryOptions(albumID));

  return (
    <>
      <BlurryHeader _colors={album.colors}>
        <HeaderDetails name={album.name} imageURL={album.imageURLs[1].url} largeImageURL={album.imageURLs[0]?.url} viewTransitionName={`album-image-${album.spotifyID}`} />
        <AlbumDetails
          album={album}
          trackCount={tracks.length}
          artists={artists.map(artist => ({
            spotifyID: artist.spotifyID,
            name: artist.name,
            imageURLs: artist.imageURLs,
          }))}
        />
        <div className="3xl:mt-8 pb-10">{album.genres && <GenrePills genres={albumGenres ?? []} />}</div>
      </BlurryHeader>
      <ReviewDetails album={album} tracks={tracks} />
      <TrackList tracks={tracks} />
    </>
  );
}
