import { ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, ErrorComponentProps, useParams, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { queryClient } from "../../../main";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAlbumReview(albumSpotifyID: string): Promise<{ reviewed_albums: ReviewedAlbum; reviewed_artists: ReviewedArtist }> {
  console.log({ albumSpotifyID });
  const response = await fetch(`${API_BASE_URL}/api/albums/${albumSpotifyID}`);
  console.log({ response });
  return await response.json();
}

const reviewQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: ["albumReview", albumID],
    queryFn: () => fetchAlbumReview(albumID),
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

export const Route = createFileRoute("/albums/$albumID/")({
  loader: ({ params }) => queryClient.ensureQueryData(reviewQueryOptions(params.albumID)),
  errorComponent: ErrorComponent,
  component: RouteComponent,
});

function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) {
    throw new Error("albumID is undefined");
  }
  const { data } = useSuspenseQuery(reviewQueryOptions(albumID));

  if (!data) {
    throw new Error("No data");
  }

  console.log({ data });
  return (
    <div>
      <h1>{data.reviewed_albums.name}</h1>
      <p>{data.reviewed_artists.name}</p>
    </div>
  );
}
