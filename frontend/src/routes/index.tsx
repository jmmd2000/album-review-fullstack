import { queryClient } from "@/main";
import { DisplayAlbum } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@components/ErrorComponent";
import AlbumScroller from "@components/AlbumScroller";
import { useCountUp } from "@/hooks/useCountUp";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAllAlbums(): Promise<{ albums: DisplayAlbum[]; numArtists: number; numAlbums: number; numTracks: number }> {
  const response = await fetch(`${API_BASE_URL}/api/albums/all?includeCounts=true`);
  return await response.json();
}

const statsQueryOptions = queryOptions({
  queryKey: ["home"],
  queryFn: fetchAllAlbums,
});

export const Route = createFileRoute("/")({
  loader: () => queryClient.ensureQueryData(statsQueryOptions),
  component: Index,
  errorComponent: ErrorComponent,
});

function Index() {
  const { data } = useQuery(statsQueryOptions);
  if (!data) return <div>Loading...</div>;
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-12 md:gap-2 w-full">
        <div className="flex-2">
          <IntroductoryText />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <HomeStats numArtists={data.numArtists} numAlbums={data.numAlbums} numTracks={data.numTracks} />
        </div>
      </div>
      <AlbumScroller albums={data.albums} />
    </>
  );
}

function IntroductoryText() {
  return (
    <div className="flex flex-col px-8 pt-8 md:pt-20 sm:pt-12 xl:p-16">
      <h1 className="mb-5 text-2xl font-semibold text-white sm:text-3xl">Welcome!</h1>
      <p className="mb-8 md:text-lg font-light text-gray-50 sm:text-xl">This is my album review blog, where I share track-by-track ratings, quick thoughts, and highlights like the best and worst songs.</p>
      <p className="mb-8 md:text-lg font-light text-gray-50 sm:text-xl">You'll find a variety of genres, both old and new, with reviews sorted by score, release year, or artist. Explore by genre or see how different artists compare.</p>
      <p className="mb-5 md:text-lg font-light text-gray-50 sm:text-xl">Whether it's a classic I missed or something brand new, every album I listen to ends up here.</p>
      <p className="mb-5 md:text-lg font-light text-gray-50 sm:text-xl">Thanks for visiting!</p>
      <p className="mb-5 md:text-lg font-light text-gray-50 italic sm:text-xl">James.</p>
    </div>
  );
}

interface HomeStatsProps {
  numArtists: number;
  numAlbums: number;
  numTracks: number;
}

const HomeStats = ({ numArtists, numAlbums, numTracks }: HomeStatsProps) => {
  const animatedAlbums = useCountUp(numAlbums);
  const animatedArtists = useCountUp(numArtists);
  const animatedTracks = useCountUp(numTracks);
  return (
    <div className="flex lg:flex-col 2xl:flex-row items-center lg:items-start justify-between 2xl:justify-center gap-8 md:gap-0 2xl:gap-20 px-8 md:px-20">
      <p className="xl:mb-5 text-5xl md:text-7xl lg:text-8xl font-light text-neutral-200 before:content-['albums'] before:text-sm before:block before:uppercase before:text-neutral-400 before:-ml-4 min-w-[1ch] md:min-w-[3ch]">{animatedAlbums}</p>
      <p className="xl:mb-5 text-5xl md:text-7xl lg:text-8xl font-light text-neutral-200 before:content-['artists'] before:text-sm before:block before:uppercase before:text-neutral-400 before:-ml-4 min-w-[1ch] md:min-w-[3ch]">{animatedArtists}</p>
      <p className="xl:mb-5 text-5xl md:text-7xl lg:text-8xl font-light text-neutral-200 before:content-['tracks'] before:text-sm before:block before:uppercase before:text-neutral-400 before:-ml-4 min-w-[1ch] md:min-w-[3ch]">{animatedTracks}</p>
    </div>
  );
};
