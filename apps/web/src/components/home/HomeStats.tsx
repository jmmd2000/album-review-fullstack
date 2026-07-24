import { Disc, Music, Users } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import BentoCard from "@/components/ui/BentoCard";
import StatBox from "@/components/ui/StatBox";
import { NoDataFound } from "@/components/ui/NoDataFound";

interface HomeStatsProps {
  numArtists: number;
  numAlbums: number;
  numTracks: number;
}

/** The three animated count-up stat cards on the home page. */
export const HomeStats = ({ numArtists, numAlbums, numTracks }: HomeStatsProps) => {
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
              icon={<Disc className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 opacity-90 text-blue-500 group-hover:rotate-180 transition-transform duration-700" />}
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
              icon={<Users className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 opacity-90 text-green-500 group-hover:scale-110 transition-transform duration-300" />}
            />
          ) : (
            <NoDataFound message="Couldn't get data." />
          )}
        </div>
      </BentoCard>

      <BentoCard className="group hover:scale-105 transition-transform duration-300 border border-white/10 bg-neutral-900/60 md:bg-white/5 backdrop-blur-md md:backdrop-blur-sm">
        <div className="px-3 py-4 sm:px-6 sm:py-6">
          {animatedTracks ? (
            <StatBox label="Tracks" value={animatedTracks} icon={<Music className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 opacity-90 text-orange-500 group-hover:animate-pulse" />} />
          ) : (
            <NoDataFound message="Couldn't get data." />
          )}
        </div>
      </BentoCard>
    </div>
  );
};
