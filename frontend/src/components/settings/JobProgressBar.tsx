import { motion } from "framer-motion";
import ArtistImage from "@/components/settings/ArtistImage";

interface JobProgressBarProps {
  /** Current item index */
  index: number;
  /** Total items to process */
  total: number;
  /** Current phase label */
  phase: "fetching" | "processing";
  /** Current artist name */
  artistName?: string;
  /** Current artist image URL */
  artistImage?: string;
  /** Whether the job is complete */
  isComplete: boolean;
  /** Accent colour class for the progress bar fill */
  accentColour: string;
}

const JobProgressBar = ({
  index,
  total,
  phase,
  artistName,
  artistImage,
  isComplete,
  accentColour,
}: JobProgressBarProps) => {
  const percentage = total > 0 ? (index / total) * 100 : 0;
  const phaseLabel = phase === "fetching" ? "Fetching" : "Processing";

  return (
    <div className="space-y-2">
      {/* Progress bar track */}
      <div className="relative h-1.5 w-full rounded-full bg-neutral-700/60 overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${isComplete ? "bg-emerald-500" : accentColour}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        {/* Subtle shimmer on active bar */}
        {!isComplete && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-transparent via-white/10 to-transparent"
            style={{ width: `${percentage}%` }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Current artist */}
      {!isComplete && artistName && (
        <motion.div
          className="flex items-center gap-2 min-h-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          key={artistName}
        >
          <ArtistImage imageUrl={artistImage} artistName={artistName} size="w-5 h-5" />
          <span className="text-xs text-neutral-300 truncate flex-1">
            <span className="text-neutral-500">{phaseLabel}</span>{" "}
            <span className="font-medium">{artistName}</span>
          </span>
          <span className="text-xs text-neutral-500 tabular-nums shrink-0">
            {index}/{total}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default JobProgressBar;
