import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import type { Progress } from "@shared/types";
import JobProgressBar from "@/components/settings/JobProgressBar";
import JobSummary from "@/components/settings/JobSummary";

export type JobPhase = "idle" | "running" | "complete";

export interface JobState {
  phase: JobPhase;
  /** Current artist being processed */
  current: Progress | null;
  /** Whether the current phase is fetching or processing */
  currentPhase: "fetching" | "processing";
  /** Current index */
  index: number;
  /** Total items to process */
  total: number;
  /** Accumulated results */
  results: {
    same: Progress[];
    changed: Progress[];
    errors: Progress[];
  };
  /** Whether the summary has been dismissed */
  dismissed: boolean;
}

interface SettingsCardProps {
  /** Card title */
  title: string;
  /** Description shown when idle */
  description: string;
  /** Button label */
  buttonText: string;
  /** Card icon */
  icon: ReactNode;
  /** Accent colour class for the top bar */
  accentBar: string;
  /** Accent colour class for the icon circle background */
  accentBgLight: string;
  /** Accent colour class for the icon text */
  accentText: string;
  /** Accent colour class for the progress bar fill */
  accentFill: string;
  /** Last run timestamp string*/
  lastRun: string;
  /** Job state (for non-streaming cards) */
  job?: JobState;
  /** Called when the trigger button is clicked */
  onTrigger: () => void;
  /** Called when the user dismisses the summary */
  onDismiss?: () => void;
  /** Whether the trigger is currently pending (for non-streaming cards) */
  isPending?: boolean;
  /** Optional extra content below the description */
  children?: ReactNode;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
  hover: {
    scale: 1.03,
    y: -5,
    boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)",
    transition: { duration: 0.3 },
  },
};

const SettingsCard = ({ title, description, buttonText, icon, accentBar, accentBgLight, accentText, accentFill, lastRun, job, onTrigger, onDismiss, isPending, children }: SettingsCardProps) => {
  const phase = job?.phase ?? "idle";
  const isRunning = phase === "running" || isPending;
  const isComplete = phase === "complete";

  return (
    <motion.div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-linear-to-br from-neutral-900 to-neutral-800 flex flex-col" variants={itemVariants} whileHover="hover">
      {/* Accent bar */}
      <div className={`h-1 w-full ${accentBar}`} />

      <div className="p-6 flex-1 flex flex-col">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${accentBgLight} ${accentText}`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium">{title}</h2>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {isRunning && job ? (
              <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <JobProgressBar
                  index={job.index}
                  total={job.total}
                  phase={job.currentPhase}
                  artistName={job.current?.artistName}
                  artistImage={job.current?.artistImage}
                  isComplete={false}
                  accentColour={accentFill}
                />
              </motion.div>
            ) : isComplete && job && !job.dismissed ? (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {/* Filled green bar */}
                <JobProgressBar index={job.total} total={job.total} phase="processing" isComplete={true} accentColour={accentFill} />
                <div className="mt-2">
                  <JobSummary
                    changedEntries={job.results.changed}
                    sameEntries={job.results.same}
                    errorEntries={job.results.errors}
                    total={job.total}
                    imageType={title.toLowerCase().includes("header") ? "header" : "image"}
                    onDismiss={onDismiss ?? (() => {})}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="text-sm text-neutral-400">{description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extra content (e.g. recalc results) */}
          {children}

          {/* Last run timestamp */}
          <span className="text-xs text-neutral-500 mt-auto">Last updated: {isRunning ? "In progress" : isComplete && !job?.dismissed ? "Just now" : lastRun}</span>
        </div>

        {/* Trigger button */}
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <button
            onClick={onTrigger}
            disabled={isRunning}
            className={`w-full relative flex items-center justify-center gap-1.5 py-2 px-4 h-11 rounded font-medium text-sm transition-colors ${
              isRunning
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 cursor-pointer border border-transparent"
            }`}
          >
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                  Processing...
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1">
                  {buttonText}
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsCard;
