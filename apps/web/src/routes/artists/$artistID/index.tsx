import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { RouteError } from "@/components/ui/RouteError";
import { ButtonLink } from "@/components/ui/ButtonLink";

async function fetchReviewedArtist(artistSpotifyID: string) {
  return handle(client.api.artists.details[":artistID"].$get({ param: { artistID: artistSpotifyID } }));
}

const artistQueryOptions = (artistID: string) =>
  queryOptions({
    queryKey: queryKeys.artists.detail(artistID),
    queryFn: () => fetchReviewedArtist(artistID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/artists/$artistID/")({
  ssr: true,
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData(artistQueryOptions(params.artistID));
  },
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} notFoundTitle="Artist not found" notFoundDetail="This artist has not been reviewed, or the link is wrong.">
      <ButtonLink to="/artists" variant="outlined">
        Back to artists
      </ButtonLink>
    </RouteError>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? socialMeta({
          title: loaderData.artist.name,
          description: loaderData.artist.unrated ? "Not yet rated." : `Rank #${loaderData.artist.leaderboardPosition} with a score of ${Math.ceil(loaderData.artist.totalScore)} out of 100.`,
          image: loaderData.artist.imageURLs?.[0]?.url,
        })
      : [],
  }),
});

function RouteComponent() {
  const { artistID } = useParams({ strict: false });
  if (!artistID) {
    throw new Error("artistID is undefined");
  }

  const { data } = useSuspenseQuery(artistQueryOptions(artistID));
  const { artist, albums, tracks } = data;

  return (
    <>
      <h1>{artist.name}</h1>
      <p>
        {artist.unrated ? "Unrated" : `Rank #${artist.leaderboardPosition}, scored ${Math.ceil(artist.totalScore)} out of 100`}. {albums.length} {albums.length === 1 ? "album" : "albums"},{" "}
        {tracks.length} tracks rated.
      </p>
      <ul>
        {albums.map(album => (
          <li key={album.spotifyID}>
            <Link to={album.finalScore != null ? "/albums/$albumID" : "/albums/$albumID/create"} params={{ albumID: album.spotifyID }}>
              {album.name}
            </Link>{" "}
            {album.finalScore != null ? album.finalScore : "unreviewed"}
          </li>
        ))}
      </ul>
    </>
  );
}
