import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { queryClient } from "@/main";
import { useEffect, useState } from "react";
import { DisplayAlbum, ExtractedColor, Genre, SpotifyAlbum, AlbumArtist } from "@shared/types";
import ErrorComponent from "@components/ui/ErrorComponent";
import BlurryHeader from "@components/layout/BlurryHeader";
import AlbumReviewForm from "@components/form/AlbumReviewForm";
import HeaderDetails from "@/components/layout/HeaderDetails";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import AlbumDetails from "@/components/album/AlbumDetails";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { api } from "@/lib/api";

//# --------------------------------------------------------------------------------------------- #
//# The usual structure for a route would be like:
// const tokenQueryOptions = queryOptions({
//   queryKey: ["album"],
//   queryFn: fetchToken,
// });
//# And this would be passed to the loader in createFileRoute() like:
// loader: () => queryClient.ensureQueryData(tokenQueryOptions),
//# But in this case, the query function needs a parameter, so we need to pass the param to queryOptions directly:
// const albumQueryOptions = (albumSpotifyID: string) =>
// queryOptions({
//   queryKey: ["spotifyAlbum", albumSpotifyID],
//   queryFn: () => fetchAlbumFromSpotify(albumSpotifyID),
// });
//# Then, in the loader:
// loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
//# And then inside the RouteComponent, you need to pass the same options to useQuery:
// const { albumID } = useParams({ strict: false });
//   if (!albumID) {
//     throw new Error("albumID is undefined");
//   }
//   const { data } = useSuspenseQuery(albumQueryOptions(albumID));
//# No need for error as the error boundary is already handled by the ErrorComponent
//# No need for isPending as it's called with useSuspenseQuery, which handles the loading state
//# --------------------------------------------------------------------------------------------- #

async function fetchAlbumFromSpotify(albumSpotifyID: string): Promise<{
  album: SpotifyAlbum;
  artists: AlbumArtist[];
  genres: Genre[];
}> {
  return api.get<{
    album: SpotifyAlbum;
    artists: AlbumArtist[];
    genres: Genre[];
  }>(`/api/spotify/albums/${albumSpotifyID}`);
}

const albumQueryOptions = (albumSpotifyID: string) =>
  queryOptions({
    queryKey: ["spotifyAlbumCreate", albumSpotifyID],
    queryFn: () => fetchAlbumFromSpotify(albumSpotifyID),
  });

// This is the maximum number of recent albums to show in the recent albums list
const MAX_RECENT = 14;

// This page is for creating a new album review
export const Route = createFileRoute("/albums/$albumID/create")({
  loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
  component: RouteComponent,
  errorComponent: ErrorComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Review: ${loaderData?.album?.name ?? "Album Review"}`,
      },
    ],
  }),
});

function RouteComponent() {
  // Get the album ID from the URL
  const { albumID } = useParams({ strict: false });
  const [recentAlbums, setRecentAlbums] = useLocalStorage<DisplayAlbum[]>("recentAlbums", []);

  // If the album ID is undefined, throw an error
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  // Fetch the album data
  const { data } = useSuspenseQuery(albumQueryOptions(albumID));

  useEffect(() => {
    if (!data.album.id) return;

    const alreadyExists = recentAlbums.some(album => album.spotifyID === data.album.id);
    if (alreadyExists) return;

    const newAlbum: DisplayAlbum = {
      spotifyID: data.album.id,
      name: data.album.name,
      artistName: data.album.artists[0].name,
      artistSpotifyID: data.album.artists[0].id,
      releaseYear: parseInt(data.album.release_date.split("-")[0], 10),
      imageURLs: data.album.images,
      finalScore: null,
      affectsArtistScore: true,
    };

    setRecentAlbums(prev => {
      const deduped = prev.filter(album => album.spotifyID !== data.album.id);
      const updated = [newAlbum, ...deduped].slice(0, MAX_RECENT);
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.album.id]);

  // State to manage selected colors
  const [selectedColors, setSelectedColors] = useState<ExtractedColor[]>(data.album.colors);

  return (
    <>
      <RequireAdmin>
        <BlurryHeader _colors={selectedColors}>
          <HeaderDetails name={data.album.name} imageURL={data.album.images[1].url} />
          {data.artists && data.artists.length > 0 && (
            <AlbumDetails
              album={data.album}
              trackCount={data.album.tracks.items.length}
              artists={data.artists}
            />
          )}
        </BlurryHeader>

        <AlbumReviewForm
          album={data.album}
          setSelectedColors={setSelectedColors}
          selectedColors={selectedColors}
          genres={data.genres}
        />
      </RequireAdmin>
    </>
  );
}
