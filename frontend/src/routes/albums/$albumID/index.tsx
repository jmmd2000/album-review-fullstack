import { DisplayTrack, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import BlurryHeader from "@components/BlurryHeader";
import ErrorComponent from "@components/ErrorComponent";
import TrackList from "@components/TrackList";
import AlbumDetails from "@components/AlbumDetails";
import ReviewDetails from "@components/ReviewDetails";
import GenrePills from "@/components/GenrePills";
import HeaderDetails from "@/components/HeaderDetails";
import { FilePenLine, Trash2 } from "lucide-react";
import { useEffect } from "react";
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
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const { albumID } = useParams({ strict: false });
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  const {
    data: { album, artist, tracks },
  } = useSuspenseQuery(reviewQueryOptions(albumID));

  return (
    <>
      <BlurryHeader _colors={album.colors}>
        <HeaderDetails name={album.name} imageURL={album.imageURLs[1].url} albumID={album.spotifyID} />
        <AlbumDetails album={album} trackCount={tracks.length} artist={artist} />
        <div className="pb-10">{album.genres && <GenrePills genres={album.genres} />}</div>
      </BlurryHeader>
      <Link to="/albums/$albumID/edit" params={{ albumID }}>
        <div className="rounded-full bg-zinc-800/40 p-3 w-max absolute top-4 right-4">
          {/* color is text-gray-400 */}
          <FilePenLine color="#99a1af" />
        </div>
      </Link>
      <div className="rounded-full bg-zinc-800/40 p-3 w-max absolute top-4 right-4">
        {/* color is text-gray-400 */}
        <Trash2 color="#99a1af" />
      </div>

      {/* <Link to="/albums/$albumID/create" params={{ albumID }}>
        <p>Create</p>
      </Link> */}

      <ReviewDetails album={album} tracks={tracks} />
      <TrackList tracks={tracks} />
    </>
  );
}
