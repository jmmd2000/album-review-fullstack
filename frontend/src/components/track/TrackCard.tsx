import { DisplayTrack } from "@shared/types";
import { convertDuration } from "@/helpers/convertDuration";
import { getRatingStyles } from "@/helpers/getRatingStyles";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

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
  const { label, gradientStartOKLCH, textColor } = getRatingStyles(
    track.rating !== undefined ? track.rating * 10 : undefined
  );

  const hasRating = track.rating !== undefined;
  const hasFeatures = track.features && track.features.length > 0;
  const featuresText = hasFeatures
    ? track.features.map(feature => feature.name).join(", ")
    : "";

  // Get the smallest album image that's at least 64px
  const albumImage = track.imageURLs?.find(img => img.width >= 64) || track.imageURLs?.[0];

  return (
    <motion.div
      className={`py-2 bg-linear-to-br from-neutral-800/40 to-neutral-900 border border-neutral-800 rounded-lg flex items-center transition-colors w-full max-w-[80ch] 3xl:max-w-[100ch]`}
      style={{
        background: `linear-gradient(to left, ${gradientStartOKLCH} 1%, #171717 25%)`,
      }}
      whileHover={{
        x: 5,
        y: -2,
        transition: { duration: 0.1 },
      }}
    >
      {/* Track number or Album image in the same position */}
      {trackNumber ? (
        <div className="px-4 text-center text-md text-zinc-400">{trackNumber}</div>
      ) : albumImage ? (
        <div className="px-4 shrink-0">
          <img
            src={albumImage.url}
            alt={track.name}
            className="w-10 h-10 rounded-lg"
            style={{ viewTransitionName: `track-image-${track.spotifyID}` }}
          />
        </div>
      ) : (
        <div className="px-4" />
      )}

      {/* Only show album image here if we're also showing track number */}
      {trackNumber && albumImage && (
        <div className="ml-2 mr-3 shrink-0">
          <img
            src={albumImage.url}
            alt={track.name}
            className="w-10 h-10 rounded-lg"
            style={{ viewTransitionName: `track-image-${track.spotifyID}` }}
          />
        </div>
      )}

      {/* Track name and artist */}
      <div className="grow min-w-0">
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
      <div className="hidden sm:flex text-sm text-zinc-400 items-center gap-1 mr-2">
        <Clock className="h-3 w-3 opacity-70" />
        <p>{convertDuration(track.duration)}</p>
      </div>

      {/* Rating or form input */}
      <div className="shrink-0 w-32 -mr-3 sm:mr-2">
        {hasRating && !children ? (
          <p
            className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-bold ${textColor}`}
          >
            {label}
          </p>
        ) : children ? (
          <div>{children}</div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default TrackCard;
