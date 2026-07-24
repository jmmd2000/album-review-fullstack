import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@/components/ui/ErrorComponent";
import AlbumScroller from "@/components/album/AlbumScroller";
import { GradientOverlay } from "@/components/home/GradientOverlay";
import { IntroductoryText } from "@/components/home/IntroductoryText";
import { HomeStats } from "@/components/home/HomeStats";
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
  errorComponent: ErrorComponent,
});

function Index() {
  const { data } = useQuery(statsQueryOptions);
  if (!data) return <div>Loading...</div>;
  return (
    <>
      <AlbumScroller albums={data.albums} />
      <GradientOverlay>
        <div className="flex flex-col pt-8 sm:pt-12 md:justify-center md:pt-0 min-h-[calc(100vh-70px)] md:min-h-[calc(100vh-80px)]">
          <div className="flex flex-col gap-10 sm:gap-12 md:gap-16 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 3xl:w-2/5">
            <IntroductoryText />
            <HomeStats numArtists={data.numArtists ?? 0} numAlbums={data.numAlbums ?? 0} numTracks={data.numTracks ?? 0} />
          </div>
        </div>
      </GradientOverlay>
    </>
  );
}
