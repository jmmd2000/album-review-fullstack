import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";

async function fetchAlbumReview(albumSpotifyID: string) {
  return handle(client.api.albums[":albumID"].$get({ param: { albumID: albumSpotifyID } }));
}

const reviewQueryOptions = (albumID: string) =>
  queryOptions({
    queryKey: queryKeys.albums.detail(albumID),
    queryFn: () => fetchAlbumReview(albumID),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/albums/$albumID/")({
  ssr: true,
  loader: async ({ params, context }) => {
    return context.queryClient.ensureQueryData(reviewQueryOptions(params.albumID));
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: loaderData
      ? socialMeta({
          title: `${loaderData.album.name} by ${loaderData.album.artistName}`,
          description: `Scored ${loaderData.album.finalScore} out of 100. Released ${loaderData.album.releaseYear}.`,
          image: loaderData.album.imageURLs[0]?.url,
        })
      : [],
  }),
});

function RouteComponent() {
  const { albumID } = useParams({ strict: false });
  if (!albumID) {
    throw new Error("albumID is undefined");
  }

  const {
    data: { album, artists, tracks },
  } = useSuspenseQuery(reviewQueryOptions(albumID));

  return (
    <>
      <h1>{album.name}</h1>
      <p>
        {artists.map((artist, index) => (
          <span key={artist.spotifyID}>
            {index > 0 && ", "}
            <Link to="/artists/$artistID" params={{ artistID: artist.spotifyID }}>
              {artist.name}
            </Link>
          </span>
        ))}{" "}
        {album.releaseYear}
      </p>
      <p>
        Scored {album.finalScore} out of 100. Favourite song {album.bestSong}, least favourite {album.worstSong}.
      </p>
      {album.reviewContent && <p>{album.reviewContent}</p>}
      <ol>
        {tracks.map(track => (
          <li key={track.spotifyID}>
            {track.name} {track.rating ?? "unrated"}
          </li>
        ))}
      </ol>
    </>
  );
}
