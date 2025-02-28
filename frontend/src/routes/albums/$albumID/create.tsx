import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { queryClient } from "../../../main";
import { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExtractedColor, SpotifyAlbum } from "@shared/types";
import BlurryHeader from "../../../components/BlurryHeader";
import AlbumReviewForm from "../../../components/AlbumReviewForm";
// import AlbumHeader from "../../../components/AlbumHeader";
const API_BASE_URL = import.meta.env.VITE_API_URL;

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

async function fetchAlbumFromSpotify(albumSpotifyID: string): Promise<SpotifyAlbum> {
  const response = await fetch(`${API_BASE_URL}/api/spotify/albums/${albumSpotifyID}`);
  return await response.json();
}

const albumQueryOptions = (albumSpotifyID: string) =>
  queryOptions({
    queryKey: ["spotifyAlbumCreate", albumSpotifyID],
    queryFn: () => fetchAlbumFromSpotify(albumSpotifyID),
  });

const ErrorComponent = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    // Reset the query error boundary
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      {error.message}
      <button
        onClick={() => {
          // Invalidate the route to reload the loader, and reset any router error boundaries
          router.invalidate();
        }}
      >
        retry
      </button>
    </div>
  );
};

// This page is for creating a new album review

export const Route = createFileRoute("/albums/$albumID/create")({
  loader: ({ params }) => queryClient.ensureQueryData(albumQueryOptions(params.albumID)),
  component: RouteComponent,
  errorComponent: ErrorComponent,
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

  // State to manage selected colors
  const [selectedColors, setSelectedColors] = useState<ExtractedColor[]>(data.colors);

  return (
    <>
      <BlurryHeader colors={selectedColors}>{/* <AlbumHeader album={data} artist={data.artist} /> */}</BlurryHeader>
      <AlbumReviewForm album={data} setSelectedColors={setSelectedColors} selectedColors={selectedColors} />
    </>
  );
}

// interface TrackCardProps {
//   trackNumber: number;
//   name: string;
//   duration_ms: number;
//   trackID: string;
// }

// const TrackCard = (props: TrackCardProps) => {
//   const { trackNumber, name, duration_ms } = props;
//   return (
//     <div className="flex justify-between">
//       <p>
//         {trackNumber}. {name}
//       </p>
//       <p>{duration_ms / 1000}</p>
//     </div>
//   );
// };
