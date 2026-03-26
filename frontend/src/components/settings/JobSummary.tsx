import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, RefreshCw, X, ChevronDown } from "lucide-react";
import { Progress } from "@shared/types";
import ArtistImage from "@/components/settings/ArtistImage";
import ImageComparison from "@/components/settings/ImageComparison";

type ResultTab = "changed" | "unchanged" | "errors";

interface JobSummaryProps {
  /** Artists whose images were updated */
  changedEntries: Progress[];
  /** Artists whose images were unchanged */
  sameEntries: Progress[];
  /** Artists that failed */
  errorEntries: Progress[];
  /** Total items processed */
  total: number;
  /** Whether this is an image or header job (affects comparison display) */
  imageType: "image" | "header";
  /** Called when the user dismisses the summary */
  onDismiss: () => void;
}

const JobSummary = ({
  changedEntries,
  sameEntries,
  errorEntries,
  total,
  imageType,
  onDismiss,
}: JobSummaryProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>(
    changedEntries.length > 0 ? "changed" : sameEntries.length > 0 ? "unchanged" : "errors"
  );

  const processed = changedEntries.length + sameEntries.length + errorEntries.length;
  const hasResults = processed > 0;

  if (!hasResults) return null;

  const allTabs: { key: ResultTab; label: string; count: number; colour: string }[] = [
    {
      key: "changed",
      label: "Updated",
      count: changedEntries.length,
      colour: "text-amber-400",
    },
    {
      key: "unchanged",
      label: "Unchanged",
      count: sameEntries.length,
      colour: "text-neutral-400",
    },
    { key: "errors", label: "Failed", count: errorEntries.length, colour: "text-red-400" },
  ];
  const tabs = allTabs.filter(t => t.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-2"
    >
      {/* Summary line */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          {changedEntries.length > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <RefreshCw className="w-3 h-3" />
              <strong>{changedEntries.length}</strong> updated
            </span>
          )}
          {sameEntries.length > 0 && (
            <span className="flex items-center gap-1 text-neutral-400">
              <CheckCircle className="w-3 h-3" />
              <strong>{sameEntries.length}</strong> unchanged
            </span>
          )}
          {errorEntries.length > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <X className="w-3 h-3" />
              <strong>{errorEntries.length}</strong> failed
            </span>
          )}
          <span className="text-neutral-600 text-[10px]">
            ({processed}/{total})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {processed > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-800"
            >
              {expanded ? "Hide" : "Details"}
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1 rounded text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expandable results drawer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden">
              {/* Tab bar */}
              {tabs.length > 1 && (
                <div className="flex border-b border-neutral-800">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors relative ${
                        activeTab === tab.key
                          ? `${tab.colour} bg-neutral-800/50`
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30"
                      }`}
                    >
                      {tab.label} ({tab.count})
                      {activeTab === tab.key && (
                        <motion.div
                          layoutId="summary-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-px bg-current"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab content */}
              <div className="max-h-48 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === "changed" && changedEntries.length > 0 && (
                    <TabContent key="changed">
                      {changedEntries.map((entry, i) => {
                        const isImage = imageType === "image";
                        const hasComparison = isImage
                          ? entry.newArtistImage && entry.artistImage !== entry.newArtistImage
                          : entry.newHeaderImage && entry.headerImage !== entry.newHeaderImage;

                        return (
                          <div
                            key={`${entry.spotifyID}-${i}`}
                            className="flex items-center gap-2.5 px-3 py-2 border-b border-neutral-800/50 last:border-0"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-400/60 shrink-0" />
                            {hasComparison ? (
                              <ImageComparison
                                beforeImage={isImage ? entry.artistImage : entry.headerImage}
                                afterImage={
                                  isImage ? entry.newArtistImage : entry.newHeaderImage
                                }
                                artistName={entry.artistName}
                                size="w-7 h-7"
                                type={isImage ? "profile" : "header"}
                              />
                            ) : (
                              <ArtistImage
                                imageUrl={entry.artistImage}
                                artistName={entry.artistName}
                                size="w-7 h-7"
                              />
                            )}
                            <span className="text-xs text-neutral-300 truncate">
                              {entry.artistName}
                            </span>
                          </div>
                        );
                      })}
                    </TabContent>
                  )}

                  {activeTab === "unchanged" && sameEntries.length > 0 && (
                    <TabContent key="unchanged">
                      <div className="grid grid-cols-2 gap-px bg-neutral-800/30">
                        {sameEntries.map((entry, i) => (
                          <div
                            key={`${entry.spotifyID}-${i}`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80"
                          >
                            <CheckCircle className="w-3 h-3 text-neutral-600 shrink-0" />
                            <ArtistImage
                              imageUrl={entry.artistImage}
                              artistName={entry.artistName}
                              size="w-5 h-5"
                            />
                            <span className="text-xs text-neutral-500 truncate">
                              {entry.artistName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TabContent>
                  )}

                  {activeTab === "errors" && errorEntries.length > 0 && (
                    <TabContent key="errors">
                      {errorEntries.map((entry, i) => (
                        <div
                          key={`${entry.spotifyID}-${i}`}
                          className="flex items-center gap-2.5 px-3 py-2 border-b border-neutral-800/50 last:border-0"
                        >
                          <X className="w-3 h-3 text-red-400/60 shrink-0" />
                          <ArtistImage
                            imageUrl={entry.artistImage}
                            artistName={entry.artistName}
                            size="w-5 h-5"
                          />
                          <span className="text-xs text-neutral-400 truncate">
                            {entry.artistName}
                          </span>
                        </div>
                      ))}
                    </TabContent>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default JobSummary;

/** Wrapper for animated tab content transitions */
const TabContent = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
);
