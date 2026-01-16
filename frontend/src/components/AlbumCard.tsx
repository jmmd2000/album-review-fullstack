import { DisplayAlbum } from "@shared/types";
import { Link } from "@tanstack/react-router";
import RatingChip from "./RatingChip";
import { motion } from "framer-motion";
import { useState } from "react";
import { Bookmark, BookmarkX, Loader2, StarOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * The props for the AlbumCard component.
 */
interface AlbumCardProps {
  /** The album to display */
  album: DisplayAlbum;
  /** Whether the album is bookmarked, default false */
  bookmarked?: boolean;
}

/**
 * This component creates a card for an album with an image, name, artist, and review score.
 * @param {DisplayAlbum} album The album to display
 */
const AlbumCard = ({ album, bookmarked = false }: AlbumCardProps) => {
  const toURL = album.finalScore != null ? "/albums/$albumID" : "/albums/$albumID/create";
  const artistNames =
    album.albumArtists && album.artistSpotifyIDs
      ? album.albumArtists
          .filter((artist) => album.artistSpotifyIDs?.includes(artist.spotifyID))
          .map((artist) => artist.name)
          .join(", ")
      : album.artistName;

  return (
    <Link params={{ albumID: album.spotifyID }} to={toURL} resetScroll viewTransition className="block">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} whileHover={{ y: -10 }} className="flex flex-col rounded-xl items-center w-full max-w-[240px]">
        <img
          src={album.imageURLs[1].url}
          alt={album.name}
          className="w-full aspect-square rounded-lg"
          style={{
            viewTransitionName: `album-image-${album.spotifyID}`,
          }}
        />

        <div className="flex justify-between w-full">
          <div className="flex flex-col px-0 py-1 w-[90%] relative">
            <h2 className="w-full max-w-[120px] md:max-w-[160px] text-sm font-medium truncate">{album.name}</h2>
            <p className="text-xs text-gray-500 truncate">{artistNames}</p>
          </div>

          {album.finalScore != null ? (
            album.affectsArtistScore ? (
              <div className="grid place-items-center">
                <RatingChip rating={album.finalScore} options={{ small: true }} />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <StarOff className="w-3 h-3 text-yellow-900" />
                <RatingChip rating={album.finalScore} options={{ small: true }} />
              </div>
            )
          ) : (
            <div className="grid place-items-center">
              <BookmarkButton album={album} bookmarked={bookmarked} />
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default AlbumCard;

interface BookmarkButtonProps {
  /** The album to bookmark/unbookmark */
  album: DisplayAlbum;
  /** Current bookmark state */
  bookmarked: boolean;
}

function BookmarkButton({ album, bookmarked }: BookmarkButtonProps) {
  const queryClient = useQueryClient();
  const [isHovering, setIsHovering] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);

  // Mutation for adding a bookmark
  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/${album.spotifyID}/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(album),
      });
      if (!res.ok) throw new Error("Failed to add bookmark");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate so useBookmarkStatus refetches
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  // Mutation for removing a bookmark (204 No Content)
  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/${album.spotifyID}/remove`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove bookmark");
      // no res.json() here since it's 204
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const isLoading = addMutation.isPending || removeMutation.isPending;
  const isRemoving = isHovering && isBookmarked;
  const iconColor = {
    fill: isRemoving ? "#dc2626" : isBookmarked ? "#22c55e" : "transparent",
    stroke: isRemoving ? "white" : isBookmarked ? "#22c55e" : isHovering ? "#22c55e" : "#717171",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBookmarked) {
      setIsBookmarked(() => !isBookmarked);
      removeMutation.mutate();
    } else {
      setIsBookmarked(() => !isBookmarked);
      addMutation.mutate();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
      title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
      disabled={isLoading}
      className="rounded-md bg-neutral-800 bg-opacity-60 p-1 backdrop-blur-md transition-all duration-200 hover:bg-neutral-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 active:scale-95 disabled:opacity-50 cursor-pointer"
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" stroke={isBookmarked ? "#22c55e" : "#717171"} />
      ) : isRemoving ? (
        <BookmarkX size={20} fill={iconColor.fill} stroke={iconColor.stroke} />
      ) : (
        <Bookmark size={20} fill={iconColor.fill} stroke={iconColor.stroke} />
      )}
    </button>
  );
}
