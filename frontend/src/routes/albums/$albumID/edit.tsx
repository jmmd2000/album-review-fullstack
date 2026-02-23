import {
  ExtractedColor,
  Genre,
  ReviewedAlbum,
  ReviewedArtist,
  ReviewedTrack,
} from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import BlurryHeader from "@components/layout/BlurryHeader";
import AlbumReviewForm from "@components/form/AlbumReviewForm";
import { useState } from "react";
import ErrorComponent from "@components/ui/ErrorComponent";
import HeaderDetails from "@/components/layout/HeaderDetails";
import AlbumDetails from "@/components/album/AlbumDetails";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { api } from "@/lib/api";

async function fetchAlbumFromDB(albumSpotifyID: string): Promise<{
  album: ReviewedAlbum;
  artists: ReviewedArtist[];
  tracks: ReviewedTrack[];
  allGenres: Genre[];
  albumGenres: Genre[];
}> {
  return api.get<{
    album: ReviewedAlbum;
    artists: ReviewedArtist[];
    tracks: ReviewedTrack[];
    allGenres: Genre[];
    albumGenres: Genre[];
  }>(`/api/albums/${albumSpotifyID}`);
}

const albumQueryOptions = (albumSpotifyID: string) =>
  queryOptions({
    queryKey: ["reviewedAlbumEdit", albumSpotifyID],
    queryFn: () => fetchAlbumFromDB(albumSpotifyID),
  });

export const Route = createFileRoute("/albums/$albumID/edit")({
  loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
  errorComponent: ErrorComponent,
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Edit: ${loaderData?.album?.name ?? "Edit Album Review"}`,
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
      <RequireAdmin>
        <BlurryHeader _colors={selectedColors}>
          <HeaderDetails
            name={data.album.name}
            imageURL={data.album.imageURLs[1].url}
            largeImageURL={data.album.imageURLs[0]?.url}
          />
          <AlbumDetails
            album={data.album}
            trackCount={data.tracks.length}
            artists={data.artists.map(artist => ({
              spotifyID: artist.spotifyID,
              name: artist.name,
              imageURLs: artist.imageURLs,
            }))}
          />
        </BlurryHeader>

        <AlbumReviewForm
          album={data.album}
          tracks={data.tracks}
          setSelectedColors={setSelectedColors}
          selectedColors={selectedColors}
          genres={data.allGenres}
        />
      </RequireAdmin>
    </>
  );
}
