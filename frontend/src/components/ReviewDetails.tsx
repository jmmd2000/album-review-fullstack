import { DisplayTrack, ReviewedAlbum } from "@shared/types";
import RatingChip from "./RatingChip";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

/**
 * The props for the ReviewDetails component.
 */
interface ReviewDetailsProps {
  /** The album being reviewed */
  album: ReviewedAlbum;
  /** The tracks on the album */
  tracks: DisplayTrack[];
}

const slideInFromLeft = (delay: number) => ({
  initial: { y: "10px", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, delay },
});

/**
 * This component displays the review content, best and worst song, and rating for the album.
 * @param {ReviewedAlbum} album The album being reviewed
 * @param {DisplayTrack[]} tracks The tracks on the album
 */
const ReviewDetails = ({ album }: ReviewDetailsProps) => {
  return (
    <div className="flex flex-col items-center justify-evenly w-[90%] md:w-[80ch] mx-auto mb-8">
      <motion.div {...slideInFromLeft(0.2)}>
        <RatingChip
          rating={album.finalScore}
          options={{
            textBelow: true,
            small: false,
          }}
          scoreBreakdown={{
            baseScore: album.reviewScore,
            bonuses: album.reviewBonuses,
            affectsArtistScore: album.affectsArtistScore,
          }}
        />
      </motion.div>
      <BestWorstSong bestSong={album.bestSong} worstSong={album.worstSong} />
      {album.reviewContent && <ReviewContent reviewContent={album.reviewContent} />}
    </div>
  );
};

export default ReviewDetails;

/**
 * The props for the BestWorstSong component.
 */
interface BestWorstSongProps {
  /** The best song on the album */
  bestSong?: string;
  /** The worst song on the album */
  worstSong?: string;
  /** Best song input */
  bestInput?: React.ReactNode;
  /** Worst song input */
  worstInput?: React.ReactNode;
}

/**
 * This component displays the best and worst song on the album.
 * @param {string} bestSong The best song on the album
 * @param {string} worstSong The worst song on the album
 */
export const BestWorstSong = ({ bestSong, worstSong, bestInput, worstInput }: BestWorstSongProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 my-6 w-3/5 sm:w-full max-w-3xl">
      <motion.div {...slideInFromLeft(0.4)} className="flex-1 rounded-lg overflow-hidden border-2 border-emerald-500/30 shadow-sm">
        <div className="bg-emerald-500/20 px-3 py-1.5">
          <p className="text-emerald-400 text-xs font-medium tracking-wider flex items-center">
            <ThumbsUp className="w-4 h-4 mr-2 text-emerald-400" />
            BEST SONG(s)
          </p>
        </div>
        {bestInput ? (
          <div className="p-3 text-center font-medium text-emerald-50 bg-gradient-to-b from-emerald-900/40 to-transparent truncate">{bestInput}</div>
        ) : (
          <p className="p-3 text-center font-medium text-emerald-50 bg-gradient-to-b from-emerald-900/40 to-transparent truncate">{bestSong}</p>
        )}
      </motion.div>

      <motion.div {...slideInFromLeft(0.6)} className="flex-1 rounded-lg overflow-hidden border-2 border-red-500/30 shadow-sm">
        <div className="bg-red-500/20 px-3 py-1.5">
          <p className="text-red-400 text-xs font-medium tracking-wider flex items-center">
            <ThumbsDown className="w-4 h-4 mr-2 text-red-400" />
            WORST SONG(s)
          </p>
        </div>
        {worstInput ? (
          <div className="p-3 text-center font-medium text-red-50 bg-gradient-to-b from-red-900/40 to-transparent truncate">{worstInput}</div>
        ) : (
          <p className="p-3 text-center font-medium text-red-50 bg-gradient-to-b from-red-900/40 to-transparent truncate">{worstSong}</p>
        )}
      </motion.div>
    </div>
  );
};

interface ReviewContentProps {
  /** The review content */
  reviewContent: string;
}

export const ReviewContent = ({ reviewContent }: ReviewContentProps) => {
  // Parse and format the content
  const formattedContent = useMemo(() => {
    // Process the content step by step
    let processedContent = reviewContent;

    // Replace the markdown-style formatting with HTML with enhanced styling
    processedContent = processedContent
      // Bold formatting - using stronger font-weight and slightly brighter color
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:900; color:#ffffff">$1</strong>')
      // Italic formatting
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Underline formatting
      .replace(/__([^_]+)__/g, "<u>$1</u>")
      // Color formatting
      .replace(/\{color:#fb2c36\}([^{]+)\{color\}/g, '<span style="color:#fb2c36; font-weight:700">$1</span>');

    return processedContent;
  }, [reviewContent]);

  return (
    <motion.div {...slideInFromLeft(0.8)}>
      <div className="w-full mt-6 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40 overflow-hidden">
        <div className="relative px-5 py-4 border-l-4 border-neutral-800">
          <blockquote className="text-zinc-200 text-sm sm:text-base font-light">
            <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </blockquote>
        </div>
      </div>
    </motion.div>
  );
};
