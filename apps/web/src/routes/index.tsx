import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";

async function fetchAllAlbums() {
  return handle(client.api.albums.all.$get({ query: { includeCounts: "true" } }));
}

const statsQueryOptions = queryOptions({
  queryKey: queryKeys.home,
  queryFn: fetchAllAlbums,
});

export const Route = createFileRoute("/")({
  ssr: true,
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQueryOptions),
  head: () => ({
    meta: socialMeta({
      title: "JamesReviewsMusic",
      description: "This is my album review blog, where I share my thoughts on a variety of albums and artists.",
    }),
  }),
  component: Index,
});

function Index() {
  const data = Route.useLoaderData();

  return (
    <>
      <h1>James Reviews Music</h1>
      <p>This is my album review blog, where I share my thoughts on a variety of albums and artists.</p>
      <dl>
        <dt>Albums</dt>
        <dd>{data.numAlbums ?? 0}</dd>
        <dt>Artists</dt>
        <dd>{data.numArtists ?? 0}</dd>
        <dt>Tracks</dt>
        <dd>{data.numTracks ?? 0}</dd>
      </dl>
    </>
  );
}
