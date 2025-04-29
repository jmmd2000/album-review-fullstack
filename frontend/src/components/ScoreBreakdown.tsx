import { ReviewBonuses } from "@shared/types";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import Button from "./Button";

interface ScoreBreakdownProps {
  baseScore: number;
  bonuses: ReviewBonuses;
  finalScore: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A dialog component that displays a detailed breakdown of an album's score.
 * Shows the base score and all applicable bonuses that contribute to the final score.
 */
const ScoreBreakdown = ({ baseScore, bonuses, finalScore, isOpen, onClose }: ScoreBreakdownProps) => {
  // Format positive numbers with a plus sign
  const formatBonus = (value: number) => {
    if (value === 0) return "0";
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  };

  // Tooltip descriptions
  const getBonusDescription = (bonusType: keyof ReviewBonuses) => {
    switch (bonusType) {
      case "qualityBonus":
        return "High proportion of tracks rated Brilliant/Amazing (Max +1.5)";
      case "perfectBonus":
        return "Tracks rated Perfect (Max +1.5)";
      case "consistencyBonus":
        return "Consistent track quality (Max +1)";
      case "noWeakBonus":
        return "No tracks rated below Good (Max +1)";
      case "totalBonus":
        return "Sum of all bonuses (capped at 5 points)";
      default:
        return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              backdropFilter: "blur(20px) saturate(180%)",
            }}
          />
          <motion.div
            className="fixed inset-0 z-41 bg-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backdropFilter: "blur(12px)",
            }}
          />

          <motion.div className="fixed inset-0 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div
              className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden backdrop-blur-[256px]"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{
                scale: 1,
                y: 0,
                opacity: 1,
                transition: {
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  delay: 0.1,
                },
              }}
              exit={{
                scale: 0.9,
                y: 20,
                opacity: 0,
                transition: { duration: 0.2 },
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b p-4">
                <motion.h3 className="text-lg font-semibold" initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1, transition: { delay: 0.2 } }}>
                  Score Breakdown
                </motion.h3>
                <motion.button onClick={onClose} className="text-gray-500 hover:text-red-600" whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Score Details */}
                <motion.div
                  className="bg-transparent backdrop-blur-xl p-4 rounded-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.4 },
                  }}
                >
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <motion.div className="text-gray-400 font-medium" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.5 } }}>
                      Base Score:
                    </motion.div>
                    <motion.div className="font-bold text-right" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.5 } }}>
                      {baseScore}
                    </motion.div>

                    {/* Staggered animations for each bonus */}
                    {bonuses.qualityBonus > 0 && <BreakdownRow title={"Quality Tracks"} description={getBonusDescription("qualityBonus")} bonus={formatBonus(bonuses.qualityBonus)} animationDelay={0.6} />}
                    {bonuses.perfectBonus > 0 && <BreakdownRow title={"Perfect Tracks"} description={getBonusDescription("perfectBonus")} bonus={formatBonus(bonuses.perfectBonus)} animationDelay={0.7} />}
                    {bonuses.consistencyBonus > 0 && <BreakdownRow title={"Consistency"} description={getBonusDescription("consistencyBonus")} bonus={formatBonus(bonuses.consistencyBonus)} animationDelay={0.8} />}
                    {bonuses.noWeakBonus > 0 && <BreakdownRow title={"No Weak Tracks"} description={getBonusDescription("noWeakBonus")} bonus={formatBonus(bonuses.noWeakBonus)} animationDelay={0.9} />}

                    {/* Divider */}
                    <motion.div
                      className="col-span-2 border-t my-2"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{
                        opacity: 1,
                        scaleX: 1,
                        transition: { delay: 1.0 },
                      }}
                    />

                    <motion.div className="text-gray-400 font-medium" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 1.1 } }}>
                      Total Bonus:
                    </motion.div>
                    <motion.div className="font-medium text-green-600 text-right" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0, transition: { delay: 1.1 } }}>
                      {formatBonus(bonuses.totalBonus)}
                    </motion.div>

                    <motion.div className="text-gray-400 font-medium" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: 1.2 } }}>
                      Final Score:
                    </motion.div>
                    <motion.div className="font-bold text-right" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0, transition: { delay: 1.2 } }}>
                      {finalScore}
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                className="bg-transparent p-4 border-t text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 1.3 },
                }}
              >
                <Button onClick={onClose} label="Close" />
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScoreBreakdown;

interface BreakdownRowProps {
  title: string;
  description: string;
  bonus: string;
  animationDelay: number;
}

const BreakdownRow = ({ title, description, bonus, animationDelay }: BreakdownRowProps) => {
  return (
    <>
      <motion.div className="text-gray-300 flex items-center group relative" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: animationDelay } }}>
        {title}
        <Info className="w-4 h-4 text-gray-400 ml-1" />
        <div className="absolute bottom-full left-0 mb-1 w-52 border border-neutral-800 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          {description}
        </div>
      </motion.div>
      <motion.div className="font-medium text-green-600 text-right" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0, transition: { delay: animationDelay } }}>
        {bonus}
      </motion.div>
    </>
  );
};
