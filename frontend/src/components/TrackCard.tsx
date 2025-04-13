import { DisplayTrack } from "@shared/types";
import { convertDuration } from "@/helpers/convertDuration";
import { getRatingStyles } from "@/helpers/getRatingStyles";
import { Clock } from "lucide-react";

/**
 * The props for the TrackCard component.
 */
interface TrackCardProps {
  /** The track to display */
  track: DisplayTrack;
  /** Optional: The form input, only provided when inside a form */
  children?: React.ReactNode;
  /** The track number to display */
  trackNumber?: number;
}

/**
 * This component is used to display track details for both rated tracks and tracks that are being rated inside `AlbumReviewForm`
 */
const TrackCard = ({ track, children, trackNumber }: TrackCardProps) => {
  const { label, gradientStartOKLCH, textColor } = getRatingStyles(track.rating !== undefined ? track.rating * 10 : undefined);

  const hasRating = track.rating !== undefined;
  const hasFeatures = track.features && track.features.length > 0;
  const featuresText = hasFeatures ? track.features.map((feature) => feature.name).join(", ") : "";

  return (
    <div
      className={`py-2 bg-gradient-to-br from-neutral-800/40 to-neutral-900 border-1 border-neutral-800 rounded-lg flex items-center transition-colors w-[90%] md:w-[80ch]`}
      style={{
        // In tailwdind, you can't do "from-[gradient] to-[gradient]", where gradient = "red-500". It needs to be the full class string.
        // I could just define the to, from and via colors for each rating tier in getRatingStyles, and maybe I will, but for now I just
        // defined the gradientOKLCH and used it like below.
        background: `linear-gradient(to left, ${gradientStartOKLCH} 1%, #171717 25%)`,
      }}
    >
      {/* Track number */}
      {trackNumber && <div className="px-4 text-center text-md text-zinc-400">{trackNumber}</div>}

      {/* Track name and artist */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-base font-medium truncate">{track.name}</p>
        </div>
        <div className="flex items-center text-xs text-zinc-400 gap-2">
          <p className="truncate">{track.artistName}</p>
          {hasFeatures && (
            <p className="truncate text-zinc-500" title={featuresText}>
              • {featuresText}
            </p>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="text-sm text-zinc-400 flex items-center gap-1">
        <Clock className="h-3 w-3 opacity-70" />
        <p>{convertDuration(track.duration)}</p>
      </div>

      {/* Rating or form input */}
      <div className="shrink-0 w-32">{hasRating && !children ? <p className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-bold ${textColor}`}>{label}</p> : children ? <div>{children}</div> : null}</div>
    </div>
  );
};

export default TrackCard;
