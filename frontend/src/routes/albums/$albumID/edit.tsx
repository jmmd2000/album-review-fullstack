import { ExtractedColor, ReviewedAlbum, ReviewedArtist, ReviewedTrack } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import BlurryHeader from "@components/BlurryHeader";
import AlbumReviewForm from "@components/AlbumReviewForm";
import { useState } from "react";
import ErrorComponent from "@components/ErrorComponent";
import HeaderDetails from "@/components/HeaderDetails";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAlbumFromSpotify(albumSpotifyID: string): Promise<{ album: ReviewedAlbum; artist: ReviewedArtist; tracks: ReviewedTrack[] }> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${albumSpotifyID}`);
  const data = await response.json();
  return data;
}

const albumQueryOptions = (albumSpotifyID: string) =>
  queryOptions({
    queryKey: ["reviewedAlbumEdit", albumSpotifyID],
    queryFn: () => fetchAlbumFromSpotify(albumSpotifyID),
  });

export const Route = createFileRoute("/albums/$albumID/edit")({
  loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
  errorComponent: ErrorComponent,
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Edit: ${loaderData.album.name}`,
      },
    ],
  }),
});

function RouteComponent() {
  // Get the album ID from the URL
  const { albumID } = useParams({ strict: false });

  // If the album ID is undefined, throw an error
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  // Fetch the album data
  const { data } = useSuspenseQuery(albumQueryOptions(albumID));

  const initialColors = data.album.colors;
  const [selectedColors, setSelectedColors] = useState<ExtractedColor[]>(initialColors);

  return (
    <>
      <BlurryHeader _colors={selectedColors}>
        <HeaderDetails name={data.album.name} imageURL={data.album.imageURLs[1].url} />
      </BlurryHeader>
      <AlbumReviewForm album={data.album} tracks={data.tracks} setSelectedColors={setSelectedColors} selectedColors={selectedColors} />
    </>
  );
}
