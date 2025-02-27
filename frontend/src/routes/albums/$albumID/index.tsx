import { ExtractedColor, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, ErrorComponentProps, useParams, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { queryClient } from "../../../main";
import BlurryHeader from "../../../components/BlurryHeader";
import AlbumHeader from "../../../components/AlbumHeader";
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
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
  const { data } = useSuspenseQuery(reviewQueryOptions(albumID));

  if (!data) {
    throw new Error("No data");
  }
  const album = data.reviewed_albums;
  const artist = data.reviewed_artists;
  const colors: ExtractedColor[] = JSON.parse(album.colors);
  console.log(colors);

  return (
    <>
      <BlurryHeader colors={colors}>
        <AlbumHeader album={album} artist={artist} />
      </BlurryHeader>
      <div>
        {/* {colors.map((color) => (
          <div key={color.hex} className="w-20 h-20" style={{ backgroundColor: color.hex }}>
            {color.hex}
          </div>
        ))} */}
      </div>
    </>
  );
}
