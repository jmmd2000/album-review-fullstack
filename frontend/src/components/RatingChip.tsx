import { cva } from "class-variance-authority";
import { getRatingStyles } from "@/helpers/getRatingStyles";
import { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";
import { ReviewBonuses } from "@shared/types";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

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
  };
}

/**
 * A component that displays a rating as a chip with a gradient background and an optional text label.
 * When textBelow is true and scoreBreakdown is provided, it allows users to view a detailed breakdown
 * of how the score was calculated including bonuses.
 *
 * @param {number} rating The rating to display
 * @param {object} options Options to specify whether or not to display the text label, the size of the chip, and the rating string
 * @param {object} scoreBreakdown Optional data for displaying the score breakdown
 */
const RatingChip = ({ rating, options, scoreBreakdown }: RatingChipProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { label, borderColor, textColor, backgroundColorLighter } = getRatingStyles(rating);

  const cardStyles = cva(["flex", "items-center", "flex-col", "gap-1", "w-max", "mx-auto", "relative", textColor], {
    variants: {
      small: {
        false: "mt-12 mb-4",
      },
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

  // Only show the info button if we have score breakdown data and textBelow is true
  const showInfoButton = options?.textBelow && scoreBreakdown;

  return (
    <div className={cardStyles({ small: options?.small ?? false })}>
      <motion.div className={textStyles({ small: options?.small ?? false })} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
        {options?.ratingString ? label : rating}
      </motion.div>

      {options?.textBelow && (
        <motion.div className="flex items-center gap-1" initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="uppercase text-center font-medium text-xl">{label}</p>

          {/* Info button to open score breakdown */}
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

      {/* Score breakdown dialog */}
      {scoreBreakdown && <ScoreBreakdown baseScore={scoreBreakdown.baseScore} bonuses={scoreBreakdown.bonuses} finalScore={rating} isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} />}
    </div>
  );
};

export default RatingChip;
