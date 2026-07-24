import type React from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { useHydrated } from "@/hooks/useHydrated";

const slideInFromLeft = (delay: number, entrance: boolean) => ({
  initial: entrance ? { y: "10px", opacity: 0 } : false,
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, delay },
});

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
 * This component displays the best and worst song on the album, or the review
 * form's inputs for them when editing.
 * @param {string} bestSong The best song on the album
 * @param {string} worstSong The worst song on the album
 */
export const BestWorstSong = ({ bestSong, worstSong, bestInput, worstInput }: BestWorstSongProps) => {
  const hydrated = useHydrated();
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 my-6 w-3/5 sm:w-full max-w-3xl">
      <motion.div {...slideInFromLeft(0.4, hydrated)} className="flex-1 rounded-lg overflow-hidden border-2 border-emerald-500/30 shadow-sm">
        <div className="bg-emerald-500/20 px-3 py-1.5">
          <p className="text-emerald-400 text-xs font-medium tracking-wider flex items-center">
            <ThumbsUp className="w-4 h-4 mr-2 text-emerald-400" />
            FAVOURITE SONG(s)
          </p>
        </div>
        {bestInput ? (
          <div className="p-3 text-center font-medium text-emerald-50 bg-linear-to-b from-emerald-900/40 to-transparent truncate">{bestInput}</div>
        ) : (
          <p className="p-3 text-center font-medium text-emerald-50 bg-linear-to-b from-emerald-900/40 to-transparent truncate">{bestSong}</p>
        )}
      </motion.div>

      <motion.div {...slideInFromLeft(0.6, hydrated)} className="flex-1 rounded-lg overflow-hidden border-2 border-red-500/30 shadow-sm">
        <div className="bg-red-500/20 px-3 py-1.5">
          <p className="text-red-400 text-xs font-medium tracking-wider flex items-center">
            <ThumbsDown className="w-4 h-4 mr-2 text-red-400" />
            LEAST FAVOURITE SONG(s)
          </p>
        </div>
        {worstInput ? (
          <div className="p-3 text-center font-medium text-red-50 bg-linear-to-b from-red-900/40 to-transparent truncate">{worstInput}</div>
        ) : (
          <p className="p-3 text-center font-medium text-red-50 bg-linear-to-b from-red-900/40 to-transparent truncate">{worstSong}</p>
        )}
      </motion.div>
    </div>
  );
};
