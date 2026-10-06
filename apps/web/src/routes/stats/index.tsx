import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";

async function fetchStats() {
  return handle(client.api.stats.$get());
}

const statsQueryOptions = queryOptions({
  queryKey: queryKeys.stats.overview,
  queryFn: fetchStats,
});

export const Route = createFileRoute("/stats/")({
  ssr: true,
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQueryOptions),
  component: RouteComponent,
  head: () => ({
    meta: socialMeta({
      title: "Stats",
      description: "Every album I've reviewed on one chart, with the best and worst albums and artists.",
    }),
  }),
});

function RouteComponent() {
  const { data } = useSuspenseQuery(statsQueryOptions);

  return (
    <>
      <h1>Stats</h1>
      <p>
        {data.albums.length} albums from {data.artistCount} artists across {data.genres.length} genres, with {data.ratedTrackCount} tracks rated.
      </p>
    </>
  );
}
