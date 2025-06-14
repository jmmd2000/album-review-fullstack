import { cva } from "class-variance-authority";
import { getRatingStyles } from "@/helpers/getRatingStyles";
import { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";
import { ReviewBonuses } from "@shared/types";
import { motion } from "framer-motion";
import { Info, StarOff } from "lucide-react";
import Dialog from "./Dialog";

interface RatingChipProps {
  /** The rating to display */
  rating: number;
  /** Options to specify whether or not to display the text label */
  options?: {
    textBelow?: boolean;
    small?: boolean;
    ratingString?: boolean;
  };
  /** Optional score breakdown data */
  scoreBreakdown?: {
    baseScore: number;
    bonuses: ReviewBonuses;
    affectsArtistScore: boolean;
  };
}

/**
 * A component that displays a rating as a chip with a gradient background and an optional text label.
 * When textBelow is true and scoreBreakdown is provided, it allows users to view a detailed breakdown
 * of how the score was calculated including bonuses.
 */
const RatingChip = ({ rating, options, scoreBreakdown }: RatingChipProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { label, borderColor, textColor, backgroundColorLighter } = getRatingStyles(rating);

  const isUnrated = rating === 0;
  const pillContent = isUnrated ? "UNRATED" : options?.ratingString ? label : rating;

  // Slightly smaller font for unrated when not small variant
  const unratedSizeClass = !options?.small && isUnrated ? "text-3xl" : "";

  const cardStyles = cva(["flex", "items-center", "flex-col", "gap-1", "w-max", "mx-auto", "relative", textColor], {
    variants: {
      small: { false: "mt-12 mb-4" },
    },
  });

  const textStyles = cva([borderColor, "text-center", "rounded-lg", backgroundColorLighter, "w-max"], {
    variants: {
      small: {
        true: "border-1 text-sm px-1 rounded-sm",
        false: "border-2 text-4xl px-4 py-2",
      },
    },
  });

  const showInfoButton = options?.textBelow && scoreBreakdown;

  return (
    <div className={cardStyles({ small: options?.small ?? false })}>
      {/* Pill with optional unrated tooltip */}
      <div className="relative group">
        <motion.div className={`${textStyles({ small: options?.small ?? false })} ${unratedSizeClass}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
          {pillContent}
        </motion.div>

        {isUnrated && !options?.small && (
          <>
            <motion.button className="absolute -top-4 -right-4 text-gray-600 hover:text-gray-700 transition-colors" whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }} onClick={() => setDialogOpen(true)}>
              <Info className="w-4 h-4" />
            </motion.button>
            <Dialog isOpen={isDialogOpen} onClose={() => setDialogOpen(false)} title="Unrated artists">
              <p className="text-zinc-200 mb-2">This artist is unrated. None of their reviews provide them a score.</p>
              <p className="text-zinc-200">There are two potential reasons for this:</p>
              <ol className="text-zinc-200 ml-3 list-decimal p-2">
                <li className="text-zinc-400">I don't plan to review their entire discography, so their score wouldn't be accurate.</li>
                <li className="text-zinc-400">
                  I <em>do</em> plan to review their entire discography, but the only reviews right now are non-studio-albums i.e. mixtapes, EPs etc.
                </li>
              </ol>
            </Dialog>
          </>
        )}
      </div>

      {options?.textBelow && (
        <motion.div className="flex items-center gap-1" initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          {rating > 0 && <p className="uppercase text-center font-medium text-xl">{label}</p>}

          {showInfoButton && (
            <motion.button
              onClick={() => setShowBreakdown(true)}
              className="ml-1 text-gray-600 hover:text-gray-700 transition-colors absolute -top-4 -right-4"
              title="View score breakdown"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Info className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      )}

      {scoreBreakdown && !scoreBreakdown.affectsArtistScore && (
        <div className="group absolute top-0 -right-4">
          <motion.div className="ml-1 text-gray-600 hover:text-gray-700 transition-colors" whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
            <StarOff className="w-4 h-4 text-yellow-900" />
          </motion.div>
          <div className="absolute bottom-full left-0 mb-2 w-52 border border-neutral-800 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            This review does not affect this artist's overall score.
          </div>
        </div>
      )}

      {scoreBreakdown && <ScoreBreakdown baseScore={scoreBreakdown.baseScore} bonuses={scoreBreakdown.bonuses} finalScore={rating} isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} />}
    </div>
  );
};

export default RatingChip;
