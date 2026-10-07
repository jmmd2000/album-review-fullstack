import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";

const homeQueryOptions = queryOptions({
  queryKey: queryKeys.home,
  queryFn: () => handle(client.api.home.$get()),
});

export const Route = createFileRoute("/")({
  ssr: true,
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions),
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
        <dd>{data.albumCount}</dd>
        <dt>Artists</dt>
        <dd>{data.artistCount}</dd>
      </dl>
    </>
  );
}
