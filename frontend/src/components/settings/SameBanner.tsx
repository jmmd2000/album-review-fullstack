import { Progress } from "@shared/types";
import { motion } from "framer-motion";
import { CheckCircle, CircleOff, RefreshCw, Sparkle, X } from "lucide-react";
import { useState } from "react";
import ArtistImage from "@/components/settings/ArtistImage";
import ImageComparison from "@/components/settings/ImageComparison";

interface SameBannerProps {
  /** The same progress object, if any */
  same: Progress | null;
  /** The current progress object, if any */
  currentProgress: Progress | null;
  /** The fetching progress object, if any */
  fetchingProgress: Progress | null;
  /** List of entries that are the same */
  sameEntries: Progress[];
  /** List of entries that have changed */
  changedEntries: Progress[];
  /** List of entries that encountered errors */
  errorEntries: Progress[];
  /** Type of banner, either 'image' or 'header' */
  type: "image" | "header";
  /** Total number of entries processed */
  total: number | null;
  /** Whether the processing is done */
  isDone: boolean;
  /** Whether this banner has been dismissed */
  dismissed: boolean;
  /** Function to call when dismissing the banner */
  onDismiss: () => void;
}

const SameBanner = ({
  same,
  currentProgress,
  fetchingProgress,
  sameEntries,
  changedEntries,
  errorEntries,
  type,
  total,
  isDone,
  dismissed,
  onDismiss,
}: SameBannerProps) => {
  const [expandedSame, setExpandedSame] = useState(false);
  const [expandedChanged, setExpandedChanged] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState(false);

  if (
    dismissed ||
    (!same &&
      sameEntries.length === 0 &&
      changedEntries.length === 0 &&
      errorEntries.length === 0)
  )
    return null;

  const showStats =
    isDone &&
    total &&
    (sameEntries.length > 0 ||
      changedEntries.length > 0 ||
      errorEntries.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={
        "mb-4 p-4 rounded-lg border-l-4 bg-blue-900/20 border-blue-500 text-blue-100"
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {showStats ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : fetchingProgress ? (
            <div className="animate-spin">
              <RefreshCw className="w-4 h-4 text-current" />
            </div>
          ) : currentProgress ? (
            <div className="animate-spin">
              <RefreshCw className="w-4 h-4 text-current" />
            </div>
          ) : same ? (
            <CheckCircle className="w-4 h-4 text-current" />
          ) : null}
        </div>
        <div className="flex-1">
          {showStats ? (
            // Show final stats when done
            <div className="flex items-center gap-4 flex-wrap">
              {changedEntries.length > 0 && (
                <span className="flex items-center gap-2">
                  <Sparkle className="w-4 h-4" />
                  <strong>{changedEntries.length}</strong> updated
                </span>
              )}
              {sameEntries.length > 0 && (
                <span className="flex items-center gap-2">
                  <CircleOff className="w-4 h-4" />
                  <strong>{sameEntries.length}</strong> unchanged
                </span>
              )}
              {errorEntries.length > 0 && (
                <span className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400" />
                  <strong>{errorEntries.length}</strong> failed
                </span>
              )}
              <span className="text-xs text-current/70">
                (
                {changedEntries.length +
                  sameEntries.length +
                  errorEntries.length}
                /{total} total)
              </span>
            </div>
          ) : same ? (
            // Show individual "same" result
            <div className="flex items-center gap-2">
              <ArtistImage
                imageUrl={same.artistImage}
                artistName={same.artistName}
                size="w-5 h-5"
              />
              <span>
                <strong>{same.artistName}</strong> {type} unchanged (
                {same.index}/{same.total})
              </span>
            </div>
          ) : fetchingProgress ? (
            // Show fetching progress
            <div className="flex items-center gap-2">
              <ArtistImage
                imageUrl={fetchingProgress.artistImage}
                artistName={fetchingProgress.artistName}
                size="w-5 h-5"
              />
              <span>
                Fetching <strong>{fetchingProgress.artistName}</strong> (
                {fetchingProgress.index}/{fetchingProgress.total})
              </span>
            </div>
          ) : currentProgress ? (
            // Show processing progress
            <div className="flex items-center gap-2">
              <ArtistImage
                imageUrl={currentProgress.artistImage}
                artistName={currentProgress.artistName}
                size="w-5 h-5"
              />
              <span>
                Processing <strong>{currentProgress.artistName}</strong> (
                {currentProgress.index}/{currentProgress.total})
              </span>
            </div>
          ) : (
            // Generic message
            <span>Processing {type} updates...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showStats &&
            (changedEntries.length > 1 ||
              sameEntries.length > 1 ||
              errorEntries.length > 1) && (
              <div className="flex gap-1">
                {changedEntries.length > 1 && (
                  <button
                    onClick={() => setExpandedChanged(!expandedChanged)}
                    className="text-xs px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                  >
                    {expandedChanged ? "Hide" : "Show"} Updated
                  </button>
                )}
                {sameEntries.length > 1 && (
                  <button
                    onClick={() => setExpandedSame(!expandedSame)}
                    className="text-xs px-2 py-1 rounded bg-current/20 hover:bg-current/30 transition-colors"
                  >
                    {expandedSame ? "Hide" : "Show"} Unchanged
                  </button>
                )}
                {errorEntries.length > 1 && (
                  <button
                    onClick={() => setExpandedErrors(!expandedErrors)}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
                  >
                    {expandedErrors ? "Hide" : "Show"} Failed
                  </button>
                )}
              </div>
            )}
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-current/20 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Lists */}
      {expandedChanged && changedEntries.length > 1 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 pt-3 border-t border-orange-500/20"
        >
          <div className="mb-2 text-sm font-medium text-orange-200">
            Updated Artists:
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            {changedEntries.map((entry, index) => {
              const isImageType = type === "image";
              const hasComparison = isImageType
                ? entry.newArtistImage &&
                  entry.artistImage !== entry.newArtistImage
                : entry.newHeaderImage &&
                  entry.headerImage !== entry.newHeaderImage;

              return (
                <div
                  key={`changed-${entry.spotifyID}-${index}`}
                  className="flex items-center gap-3 p-2 rounded bg-orange-500/10 border border-orange-500/20"
                >
                  <RefreshCw className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {hasComparison ? (
                      <ImageComparison
                        beforeImage={
                          isImageType ? entry.artistImage : entry.headerImage
                        }
                        afterImage={
                          isImageType
                            ? entry.newArtistImage
                            : entry.newHeaderImage
                        }
                        artistName={entry.artistName}
                        size="w-8 h-8"
                        type={isImageType ? "profile" : "header"}
                      />
                    ) : (
                      <ArtistImage
                        imageUrl={entry.artistImage}
                        artistName={entry.artistName}
                        size="w-8 h-8"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {entry.artistName}
                      </div>
                      {hasComparison && (
                        <div className="text-xs text-orange-300 mt-1">
                          {isImageType ? "Profile image" : "Header image"}{" "}
                          updated
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {expandedSame && sameEntries.length > 1 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 pt-3 border-t border-current/20"
        >
          <div className="mb-2 text-sm font-medium">Unchanged Artists:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {sameEntries.map((entry, index) => (
              <div
                key={`same-${entry.spotifyID}-${index}`}
                className="flex items-center gap-2 p-2 rounded bg-current/5"
              >
                <CheckCircle className="w-3 h-3 text-current/60 flex-shrink-0" />
                <ArtistImage
                  imageUrl={entry.artistImage}
                  artistName={entry.artistName}
                  size="w-6 h-6"
                />
                <span className="truncate">{entry.artistName}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {expandedErrors && errorEntries.length > 1 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 pt-3 border-t border-red-500/20"
        >
          <div className="mb-2 text-sm font-medium text-red-200">
            Failed Artists:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {errorEntries.map((entry, index) => (
              <div
                key={`error-${entry.spotifyID}-${index}`}
                className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20"
              >
                <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                <ArtistImage
                  imageUrl={entry.artistImage}
                  artistName={entry.artistName}
                  size="w-6 h-6"
                />
                <span className="truncate">{entry.artistName}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SameBanner;
