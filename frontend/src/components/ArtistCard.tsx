// This component shares a lot with the AlbumCard. Could create a base, reusable card component and share it.

import { DisplayArtist } from "@shared/types";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import RatingChip from "./RatingChip";

interface ArtistCardProps {
  artist: DisplayArtist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  const albumCountString =
    artist.albumCount === 1
      ? `${artist.albumCount} album`
      : `${artist.albumCount} albums`;
  const imageURL = artist.imageURLs?.[1]?.url ?? artist.imageURLs?.[0]?.url;
  return (
    <Link
      params={{ artistID: artist.spotifyID }}
      to={"/artists/$artistID"}
      resetScroll={true}
      viewTransition
      className="block"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{
          y: -10,
        }}
        className="flex flex-col rounded-xl items-center w-full max-w-[240px]"
      >
        {imageURL ? (
          <img
            src={imageURL}
            alt={artist.name}
            className="w-full aspect-square rounded-lg"
            style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }}
          />
        ) : (
          <div
            className="w-full aspect-square rounded-lg bg-neutral-800/40"
            style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }}
            aria-label={`${artist.name} image unavailable`}
          />
        )}
        <div className="flex justify-between w-full">
          <div className="flex flex-col px-0 py-1 w-[90%] relative">
            <h2 className="w-full max-w-[160px] text-sm font-medium truncate">
              {artist.name}
            </h2>
            <p className="text-xs text-gray-500">
              {artist.unrated
                ? albumCountString
                : `#${artist.currentPosition || artist.leaderboardPosition} • ${albumCountString}`}
            </p>
          </div>
          <div className="grid place-items-center">
            <RatingChip
              rating={Math.ceil(artist.displayScore || artist.totalScore)}
              options={{ small: true }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ArtistCard;
