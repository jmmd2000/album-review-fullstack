// src/components/ScoreBreakdown.tsx
import { ReviewBonuses } from "@shared/types";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import Button from "./Button";
import Dialog from "./Dialog";

interface ScoreBreakdownProps {
  baseScore: number;
  bonuses: ReviewBonuses;
  finalScore: number;
  isOpen: boolean;
  onClose: () => void;
}

const formatBonus = (value: number) => (value === 0 ? "0" : value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1));

const getBonusDescription = (type: keyof ReviewBonuses): string => {
  switch (type) {
    case "qualityBonus":
      return "High proportion of tracks rated Brilliant/Amazing (Max +1.5)";
    case "perfectBonus":
      return "Tracks rated Perfect (Max +1.5)";
    case "consistencyBonus":
      return "Consistent track quality (Max +1)";
    case "noWeakBonus":
      return "No tracks rated below Good (Max +1)";
    case "terriblePenalty":
      return "Penalty for tracks rated Terrible (Max -3)";
    case "poorQualityPenalty":
      return "Penalty for tracks rated Awful/Bad (Max -2)";
    case "noStrongPenalty":
      return "Penalty for having no tracks above Meh (Fixed -2)";
    case "totalBonus":
      return "Sum of all bonuses and penalties (between -5 and +5)";
    default:
      return "";
  }
};

const BreakdownRow = ({ title, description, bonus, isPositive, animationDelay }: { title: string; description: string; bonus: string; isPositive: boolean; animationDelay: number }) => (
  <motion.div className="grid grid-cols-2 gap-x-6 gap-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: animationDelay } }}>
    <div className="text-gray-300 flex items-center group relative">
      {title}
      <Info className="w-4 h-4 text-gray-400 ml-1" />
      <div className="absolute bottom-full left-0 mb-1 w-52 border border-neutral-800 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        {description}
      </div>
    </div>
    <div className={`font-medium text-right ${isPositive ? "text-green-600" : "text-red-500"}`}>{bonus}</div>
  </motion.div>
);

const ScoreBreakdown = ({ baseScore, bonuses, finalScore, isOpen, onClose }: ScoreBreakdownProps) => (
  <Dialog isOpen={isOpen} onClose={onClose} title="Score Breakdown">
    <div className="bg-transparent backdrop-blur-xl p-4 rounded-md">
      {/* Base score */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
        <div className="text-gray-400 font-medium">Base Score:</div>
        <div className="font-bold text-white text-right">{baseScore}</div>
      </div>

      {/* BONUSES */}
      {(bonuses.qualityBonus > 0 || bonuses.perfectBonus > 0 || bonuses.consistencyBonus > 0 || bonuses.noWeakBonus > 0) && <div className="text-sm font-medium text-green-500 mb-2">BONUSES</div>}
      {bonuses.qualityBonus > 0 && <BreakdownRow title="Quality Tracks" description={getBonusDescription("qualityBonus")} bonus={formatBonus(bonuses.qualityBonus)} isPositive animationDelay={0.2} />}
      {bonuses.perfectBonus > 0 && <BreakdownRow title="Perfect Tracks" description={getBonusDescription("perfectBonus")} bonus={formatBonus(bonuses.perfectBonus)} isPositive animationDelay={0.25} />}
      {bonuses.consistencyBonus > 0 && <BreakdownRow title="Consistency" description={getBonusDescription("consistencyBonus")} bonus={formatBonus(bonuses.consistencyBonus)} isPositive animationDelay={0.3} />}
      {bonuses.noWeakBonus > 0 && <BreakdownRow title="No Weak Tracks" description={getBonusDescription("noWeakBonus")} bonus={formatBonus(bonuses.noWeakBonus)} isPositive animationDelay={0.35} />}

      {/* PENALTIES */}
      {(bonuses.terriblePenalty < 0 || bonuses.poorQualityPenalty < 0 || bonuses.noStrongPenalty < 0) && <div className="text-sm font-medium text-red-500 mt-4 mb-2">PENALTIES</div>}
      {bonuses.terriblePenalty < 0 && <BreakdownRow title="Terrible Tracks" description={getBonusDescription("terriblePenalty")} bonus={formatBonus(bonuses.terriblePenalty)} isPositive={false} animationDelay={0.4} />}
      {bonuses.poorQualityPenalty < 0 && <BreakdownRow title="Poor Quality" description={getBonusDescription("poorQualityPenalty")} bonus={formatBonus(bonuses.poorQualityPenalty)} isPositive={false} animationDelay={0.45} />}
      {bonuses.noStrongPenalty < 0 && <BreakdownRow title="No Strong Tracks" description={getBonusDescription("noStrongPenalty")} bonus={formatBonus(bonuses.noStrongPenalty)} isPositive={false} animationDelay={0.5} />}

      {/* Total / Final */}
      <div className="border-t border-neutral-700/50 my-4" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
        <div className="text-gray-400 font-medium">Total Adjustment:</div>
        <div className={`font-medium text-right ${bonuses.totalBonus > 0 ? "text-green-600" : bonuses.totalBonus < 0 ? "text-red-500" : "text-gray-400"}`}>{formatBonus(bonuses.totalBonus)}</div>
        <div className="text-gray-400 font-medium">Final Score:</div>
        <div className="font-bold text-white text-right">{finalScore}</div>
      </div>

      <div className="text-center">
        <Button onClick={onClose} label="Close" />
      </div>
    </div>
  </Dialog>
);

export default ScoreBreakdown;
