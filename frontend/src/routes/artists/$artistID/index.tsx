import ErrorComponent from "@components/ErrorComponent";
import { queryClient } from "@/main";
import { ReviewedArtist } from "@shared/types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchReviewedArtist(artistSpotifyID: string): Promise<ReviewedArtist> {
  const response = await fetch(`${API_BASE_URL}/api/artists/${artistSpotifyID}`);
  console.log(response);
  return await response.json();
}

const artistQueryOptions = (artistID: string) =>
  queryOptions({
    queryKey: ["artistID", artistID],
    queryFn: () => fetchReviewedArtist(artistID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/artists/$artistID/")({
  loader: async ({ params }) => {
    return queryClient.ensureQueryData(artistQueryOptions(params.artistID));
  },
  errorComponent: ErrorComponent,
  component: RouteComponent,
});

function RouteComponent() {
  const { artistID } = useParams({ strict: false });
  console.log(artistID);
  if (!artistID) {
    throw new Error("artistID is undefined");
  }

  const data = useSuspenseQuery(artistQueryOptions(artistID));

  console.log(data);

  return <div>Hello "/artists/$artistID/"!</div>;
}
