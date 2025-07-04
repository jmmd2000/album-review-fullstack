import { DisplayTrack, Genre, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import BlurryHeader from "@components/BlurryHeader";
import ErrorComponent from "@components/ErrorComponent";
import TrackList from "@components/TrackList";
import AlbumDetails from "@components/AlbumDetails";
import ReviewDetails from "@components/ReviewDetails";
import GenrePills from "@/components/GenrePills";
import HeaderDetails from "@/components/HeaderDetails";
import { useEffect } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAlbumReview(albumSpotifyID: string): Promise<{ album: ReviewedAlbum; artist: ReviewedArtist; tracks: DisplayTrack[]; allGenres: Genre[]; albumGenres: Genre[] }> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${albumSpotifyID}?includeGenres=true`);
  return await response.json();
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
        title: loaderData.album.name,
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
    data: { album, artist, tracks, albumGenres },
  } = useSuspenseQuery(reviewQueryOptions(albumID));

  return (
    <>
      <BlurryHeader _colors={album.colors}>
        <HeaderDetails name={album.name} imageURL={album.imageURLs[1].url} viewTransitionName={`album-image-${album.spotifyID}`} />
        <AlbumDetails album={album} trackCount={tracks.length} artist={artist} />
        <div className="pb-10">{album.genres && <GenrePills genres={albumGenres} />}</div>
      </BlurryHeader>
      <ReviewDetails album={album} tracks={tracks} />
      <TrackList tracks={tracks} />
    </>
  );
}
