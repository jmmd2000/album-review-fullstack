import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import type { GetStatsOptions } from "@shared/types";
import { client, handle } from "@/lib/client";

async function fetchOverview() {
  return handle(client.api.stats.favourites.$get());
}

async function fetchGenreStats(slug: string) {
  return handle(client.api.stats.genres.$get({ query: { slug } }));
}

async function fetchRatingDistribution(resource: "albums" | "tracks" | "artists") {
  return handle(client.api.stats.distribution.$get({ query: { resource } }));
}

async function fetchResourceCounts() {
  return handle(client.api.stats.counts.$get());
}

const overviewQueryOptions = queryOptions({
  queryKey: queryKeys.stats.overview,
  queryFn: fetchOverview,
});

const genresQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: queryKeys.stats.genres(slug),
    queryFn: () => fetchGenreStats(slug),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

const distributionQueryOptions = (resource: "albums" | "tracks" | "artists") =>
  queryOptions({
    queryKey: queryKeys.stats.distribution(resource),
    queryFn: () => fetchRatingDistribution(resource),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

const countQueryOptions = queryOptions({
  queryKey: queryKeys.stats.counts,
  queryFn: fetchResourceCounts,
});

export const Route = createFileRoute("/stats/")({
  ssr: true,
  validateSearch: (search: Record<string, unknown>): GetStatsOptions => {
    const result: GetStatsOptions = {
      slug: (search.slug as string) || "",
      resource: (search.resource as GetStatsOptions["resource"]) || "albums",
    };

    if (result.slug === "") delete result.slug;
    if (result.resource === "albums") delete result.resource;

    return result;
  },
  loaderDeps: ({ search }) => ({
    slug: search.slug ?? "",
    resource: search.resource ?? "albums",
  }),
  loader: async ({ deps: { slug, resource }, context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(overviewQueryOptions),
      context.queryClient.ensureQueryData(genresQueryOptions(slug)),
      context.queryClient.ensureQueryData(distributionQueryOptions(resource)),
      context.queryClient.ensureQueryData(countQueryOptions),
    ]),
  component: RouteComponent,
  head: () => ({
    meta: socialMeta({
      title: "Stats",
      description: "Numbers from the whole collection, favourite genres, rating distributions and listening totals.",
    }),
  }),
});

function RouteComponent() {
  const [overview, , distribution, counts] = Route.useLoaderData();

  return (
    <>
      <h1>Stats</h1>
      <dl>
        {Object.entries(counts).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
      <h2>Rating distribution</h2>
      <ul>
        {distribution.map(bucket => (
          <li key={bucket.rating}>
            {bucket.rating} {bucket.count}
          </li>
        ))}
      </ul>
      <h2>Favourites</h2>
      <ul>
        {overview.favouriteAlbum && <li>Favourite album {overview.favouriteAlbum.name}</li>}
        {overview.leastFavouriteAlbum && <li>Least favourite album {overview.leastFavouriteAlbum.name}</li>}
        {overview.favouriteArtist && <li>Favourite artist {overview.favouriteArtist.name}</li>}
        {overview.leastFavouriteArtist && <li>Least favourite artist {overview.leastFavouriteArtist.name}</li>}
      </ul>
    </>
  );
}
