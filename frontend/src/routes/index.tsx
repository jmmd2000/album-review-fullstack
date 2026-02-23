import { queryClient } from "@/main";
import { DisplayAlbum } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@components/ui/ErrorComponent";
import AlbumScroller from "@components/album/AlbumScroller";
import { useCountUp } from "@/hooks/useCountUp";
import React from "react";
import BentoCard from "@/components/stats/BentoCard";
import StatBox from "@/components/stats/StatBox";
import { NoDataFound } from "./stats";
import { Disc, Music, Users } from "lucide-react";
import { api } from "@/lib/api";

async function fetchAllAlbums(): Promise<{
  albums: DisplayAlbum[];
  numArtists: number;
  numAlbums: number;
  numTracks: number;
}> {
  const data = await api.get<{
    albums: DisplayAlbum[];
    numArtists: number;
    numAlbums: number;
    numTracks: number;
  }>("/api/albums/all?includeCounts=true");
  return data;
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
      <AlbumScroller albums={data.albums} />
      <GradientOverlay>
        <div className="flex flex-col pt-8 sm:pt-12 md:justify-center md:pt-0 min-h-[calc(100vh-70px)] md:min-h-[calc(100vh-80px)]">
          <div className="flex flex-col gap-10 sm:gap-12 md:gap-16 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 3xl:w-2/5">
            <IntroductoryText />
            <HomeStats
              numArtists={data.numArtists}
              numAlbums={data.numAlbums}
              numTracks={data.numTracks}
            />
          </div>
        </div>
      </GradientOverlay>
    </>
  );
}

function IntroductoryText() {
  return (
    <div className="flex flex-col px-6 pt-8 sm:px-8 sm:pt-12 md:pt-16 lg:px-12 xl:px-20 max-w-2xl 3xl:max-w-3xl">
      <h1 className="mb-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl 3xl:text-7xl font-bold text-white tracking-tight">
        Welcome<span className="text-red-500">!</span>
      </h1>
      <div className="w-20 h-1 bg-linear-to-r from-red-500 to-transparent mb-8"></div>

      <p className="mb-6 text-base sm:text-lg md:text-xl font-light text-gray-100 leading-relaxed">
        This is my album review blog, where I share my thoughts on a variety of albums and
        artists.
      </p>

      <p className="mb-6 text-base sm:text-lg md:text-xl font-light text-gray-100 leading-relaxed">
        Whether it's a classic I missed or something brand new, every album I listen to ends up
        here.
      </p>

      <p className="mb-8 text-base sm:text-lg md:text-xl font-light text-gray-100">
        Thanks for visiting!
      </p>

      <div className="flex items-center gap-3">
        <div className="w-12 h-px bg-gray-500"></div>
        <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-300 italic">James</p>
      </div>
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
    <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 md:gap-8 3xl:gap-12 px-4 sm:px-8 lg:px-12 xl:px-20">
      <BentoCard className="group hover:scale-105 transition-transform duration-300 border border-white/10 bg-neutral-900/60 md:bg-white/5 backdrop-blur-md md:backdrop-blur-sm">
        <div className="px-3 py-4 sm:px-6 sm:py-6">
          {animatedAlbums ? (
            <StatBox
              label="Albums"
              value={animatedAlbums}
              icon={
                <Disc className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 opacity-90 text-blue-500 group-hover:rotate-180 transition-transform duration-700" />
              }
            />
          ) : (
            <NoDataFound message="Couldn't get data." />
          )}
        </div>
      </BentoCard>

      <BentoCard className="group hover:scale-105 transition-transform duration-300 border border-white/10 bg-neutral-900/60 md:bg-white/5 backdrop-blur-md md:backdrop-blur-sm">
        <div className="px-3 py-4 sm:px-6 sm:py-6">
          {animatedArtists ? (
            <StatBox
              label="Artists"
              value={animatedArtists}
              icon={
                <Users className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 opacity-90 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              }
            />
          ) : (
            <NoDataFound message="Couldn't get data." />
          )}
        </div>
      </BentoCard>

      <BentoCard className="group hover:scale-105 transition-transform duration-300 border border-white/10 bg-neutral-900/60 md:bg-white/5 backdrop-blur-md md:backdrop-blur-sm">
        <div className="px-3 py-4 sm:px-6 sm:py-6">
          {animatedTracks ? (
            <StatBox
              label="Tracks"
              value={animatedTracks}
              icon={
                <Music className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 opacity-90 text-orange-500 group-hover:animate-pulse" />
              }
            />
          ) : (
            <NoDataFound message="Couldn't get data." />
          )}
        </div>
      </BentoCard>
    </div>
  );
};

interface GradientOverlayProps {
  children: React.ReactNode;
}

const GradientOverlay = ({ children }: GradientOverlayProps) => {
  return (
    <>
      {/* Desktop gradient left to right */}
      <div className="fixed inset-x-0 bottom-0 top-17.5 md:top-20 z-10 hidden md:block bg-linear-to-r from-neutral-950 via-neutral-950/90 to-transparent">
        {children}
      </div>

      {/* Mobile gradient top to bottom */}
      <div className="fixed inset-x-0 bottom-0 top-17.5 z-10 md:hidden bg-linear-to-b from-neutral-950 via-neutral-950/70 to-neutral-950/30">
        {children}
      </div>
    </>
  );
};
