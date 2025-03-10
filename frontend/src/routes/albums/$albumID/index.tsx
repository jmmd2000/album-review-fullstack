import { DisplayTrack, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import BlurryHeader from "@components/BlurryHeader";
import ErrorComponent from "@components/ErrorComponent";
import AlbumHeader from "@components/AlbumHeader";
// import { Link } from "@tanstack/react-router";
import TrackList from "@components/TrackList";
import AlbumDetails from "@components/AlbumDetails";
import ReviewDetails from "@components/ReviewDetails";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAlbumReview(albumSpotifyID: string): Promise<{ album: ReviewedAlbum; artist: ReviewedArtist; tracks: DisplayTrack[] }> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${albumSpotifyID}`);
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
});

/**
 *  This is the album detail page
 *  It displays an album reviews contents along with the rated tracks in TrackCards
 */
function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  const {
    data: { album, artist, tracks },
  } = useSuspenseQuery(reviewQueryOptions(albumID));

  console.log({ album, artist, tracks });

  return (
    <>
      <BlurryHeader colors={album.colors}>
        <AlbumHeader album={album} artist={artist} />
      </BlurryHeader>
      {/* <Link to="/albums/$albumID/edit" params={{ albumID }}>
        <p>Edit</p>
      </Link>
      <Link to="/albums/$albumID/create" params={{ albumID }}>
        <p>Create</p>
      </Link> */}
      <AlbumDetails album={album} trackCount={tracks.length} artist={artist} />
      <ReviewDetails album={album} tracks={tracks} />
      <TrackList tracks={tracks} />
    </>
  );
}
