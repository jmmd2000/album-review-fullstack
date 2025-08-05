import { Progress } from "@shared/types";
import { RefreshCw, CheckCircle, X } from "lucide-react";
import ArtistImage from "@/components/settings/ArtistImage";

interface StatusIndicatorProps {
  /** The same entries in the progress */
  sameEntries: Progress[];
  /** The changed entries in the progress */
  changedEntries: Progress[];
  /** The error entries in the progress */
  errorEntries: Progress[];
  /** Whether the process is done */
  isDone: boolean;
  /** The current progress entry */
  current: Progress | null;
  /** The total number of entries */
  total: number | null;
}

const StatusIndicator = ({
  sameEntries,
  changedEntries,
  errorEntries,
  isDone,
  current,
  total,
}: StatusIndicatorProps) => {
  if (current) {
    return (
      <div className="flex items-center gap-2 text-xs text-yellow-400">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <ArtistImage
          imageUrl={current.artistImage}
          artistName={current.artistName}
          size="w-4 h-4"
        />
        <span className="truncate max-w-20">{current.artistName}</span>
      </div>
    );
  }

  if (
    isDone &&
    total &&
    (sameEntries.length > 0 ||
      changedEntries.length > 0 ||
      errorEntries.length > 0)
  ) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs">
        {changedEntries.length > 0 && (
          <div className="flex items-center gap-1 text-green-400">
            <RefreshCw className="w-3 h-3" />
            {changedEntries.length} updated
          </div>
        )}
        {sameEntries.length > 0 && (
          <div className="flex items-center gap-1 text-blue-400">
            <CheckCircle className="w-3 h-3" />
            {sameEntries.length} unchanged
          </div>
        )}
        {errorEntries.length > 0 && (
          <div className="flex items-center gap-1 text-red-400">
            <X className="w-3 h-3" />
            {errorEntries.length} failed
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default StatusIndicator;
