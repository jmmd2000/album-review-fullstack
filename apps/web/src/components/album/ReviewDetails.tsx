import type { DisplayTrack, Jsonified, ReviewedAlbum } from "@shared/types";
import RatingChip from "@/components/ui/RatingChip";
import { BestWorstSong } from "@/components/album/BestWorstSong";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { parseReviewContent } from "@shared/helpers/parseReviewContent";
import { FormattedText } from "@/components/ui/FormattedText";

/**
 * The props for the ReviewDetails component.
 */
interface ReviewDetailsProps {
  /** The album being reviewed */
  album: Jsonified<ReviewedAlbum>;
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
    <div className="flex flex-col items-center justify-evenly w-[90%] md:w-[80ch] 3xl:w-[90ch] mx-auto mb-8">
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

interface ReviewContentProps {
  /** The review content */
  reviewContent: string;
}

export const ReviewContent = ({ reviewContent }: ReviewContentProps) => {
  // Parse the content into tokens
  const tokens = useMemo(() => parseReviewContent(reviewContent), [reviewContent]);

  return (
    <motion.div {...slideInFromLeft(0.8)}>
      <div className="w-full mt-6 rounded-lg bg-linear-to-br from-neutral-800 to-neutral-900/40 overflow-hidden">
        <div className="px-5 py-4 border-l-4 border-neutral-800 text-zinc-200 text-sm sm:text-base font-light leading-relaxed">
          <FormattedText tokens={tokens} />
        </div>
      </div>
    </motion.div>
  );
};
