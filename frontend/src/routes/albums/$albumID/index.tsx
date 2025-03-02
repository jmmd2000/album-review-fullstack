import { DisplayTrack, ExtractedColor, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "../../../main";
import BlurryHeader from "../../../components/BlurryHeader";
import ErrorComponent from "../../../components/ErrorComponent";
import AlbumHeader from "../../../components/AlbumHeader";
import { Link } from "@tanstack/react-router";
import TrackList from "../../../components/TrackList";
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

function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  const {
    data: { album, artist, tracks },
  } = useSuspenseQuery(reviewQueryOptions(albumID));

  console.log({ album, artist, tracks });

  // if (!album || !artist || !tracks) {
  //   throw new Error("No data");
  // }

  console.log({ album, artist, tracks });

  const colors: ExtractedColor[] = JSON.parse(album.colors);
  // console.log({ colors });

  return (
    <>
      <BlurryHeader colors={colors}>
        <AlbumHeader album={album} artist={artist} />
      </BlurryHeader>
      <Link to="/albums/$albumID/edit" params={{ albumID }}>
        <p>Edit</p>
      </Link>
      <Link to="/albums/$albumID/create" params={{ albumID }}>
        <p>Create</p>
      </Link>

      <TrackList tracks={tracks} />
    </>
  );
}
