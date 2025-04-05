import { DisplayAlbum } from "@shared/types";
import { Link } from "@tanstack/react-router";
import RatingChip from "./RatingChip";
import { motion } from "framer-motion";
import { Bookmark, BookmarkX } from "lucide-react";
import { useState } from "react";

/**
 * The props for the AlbumCard component.
 */
interface AlbumCardProps {
  /** The album to display */
  album: DisplayAlbum;
}

/**
 * This component creates a card for an album with an image, name, artist, and review score.
 * @param {DisplayAlbum} album The album to display
 */
const AlbumCard = ({ album }: AlbumCardProps) => {
  const toURL = album.reviewScore ? "/albums/$albumID" : "/albums/$albumID/create";
  return (
    <Link params={{ albumID: album.spotifyID }} to={toURL} viewTransition className="block">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex flex-col rounded-xl items-center w-full max-w-[240px]">
        <img src={album.imageURLs[1].url} alt={album.name} className="w-full aspect-square rounded-lg" style={{ viewTransitionName: `album-image-${album.spotifyID}` }} />
        <div className="flex justify-between w-full">
          <div className="flex flex-col px-0 py-1 w-[90%] relative">
            <h2 className="w-full max-w-[160px] text-sm font-medium truncate">{album.name}</h2>
            <p className="text-xs text-gray-500">{album.artistName}</p>
          </div>
          {album.reviewScore ? (
            <div className="grid place-items-center">
              <RatingChip rating={album.reviewScore} options={{ small: true }} />
            </div>
          ) : (
            <div className="grid place-items-center">
              <BookmarkButton bookmarked={false} onClick={() => {}} spotifyID={album.spotifyID} />
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default AlbumCard;

interface BookmarkButtonProps {
  /** Whether the album is bookmarked */
  bookmarked: boolean;
  /** Function to call when the button is clicked */
  onClick: (spotifyID: string) => void;
  /** The Spotify ID of the album */
  spotifyID: string;
}

const BookmarkButton = ({ bookmarked, onClick, spotifyID }: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [isHovering, setIsHovering] = useState(false);

  const handleToggleBookmark = () => {
    setIsBookmarked(!bookmarked);
    onClick(spotifyID);
  };

  const fillColor = isHovering && isBookmarked ? "#dc2626" : isBookmarked ? "#22c55e" : "transparent";
  const strokeColor = isHovering && isBookmarked ? "white" : isBookmarked ? "#22c55e" : isHovering ? "#22c55e" : "#717171";

  return (
    <button
      className="rounded-md bg-gray-700 bg-opacity-10 bg-clip-padding p-1 backdrop-blur-sm transition-colors hover:bg-gray-700 hover:text-[#D2D2D3]"
      onClick={handleToggleBookmark}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering && isBookmarked ? <BookmarkX size={20} fill={fillColor} stroke={strokeColor} /> : <Bookmark size={20} fill={fillColor} stroke={strokeColor} />}
    </button>
  );
};
