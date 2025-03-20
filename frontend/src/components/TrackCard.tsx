import { DisplayTrack } from "@shared/types";
import { convertDuration } from "@/helpers/convertDuration";
import { convertRatingToString } from "@/helpers/convertRatingToString";
import { convertRatingToColor } from "@/helpers/convertRatingToColor";
import { cva } from "class-variance-authority";

/**
 * The props for the TrackCard component.
 */
interface TrackCardProps {
  /** The track to display */
  track: DisplayTrack;
  /** Optional: The form input, only provided when inside a form */
  children?: React.ReactNode;
}

/**
 * This component is used to display track details for both rated tracks and tracks that are being rated inside `AlbumReviewForm`
 */
const TrackCard = ({ track, children }: TrackCardProps) => {
  const mappedFeatures = track.features.map((feature) => feature.name);
  const gradientStart = convertRatingToColor(track.rating ?? -1, { gradient: true });
  const textColor = convertRatingToColor(track.rating ?? -1, { text: true });

  const trackCard = cva(["grid", "gap-2", "justify-between", "w-[90%]", "md:w-[70%]", "p-4", "rounded-lg", "bg-gradient-to-r", gradientStart, "via-zinc-800/40", "to-zinc-800/40"], {
    variants: {
      rating: {
        true: "grid-cols-6 @[950px]/TrackList:grid-cols-7",
        false: "grid-cols-5 @[950px]/TrackList:grid-cols-6",
      },
    },
  });

  const hasChildren = children !== undefined && children !== null && children !== false;

  return (
    <div className={trackCard({ rating: track.rating !== undefined })}>
      <h2 className="col-span-3 @[950px]/TrackList:col-span-2 truncate">{track.name}</h2>
      <p className="col-start-4 col-span-2 @[950px]/TrackList:col-start-3 @[950px]/TrackList:col-span-1 text-center text-zinc-300 truncate">{track.artistName}</p>
      <p className="col-span-2 hidden @[950px]/TrackList:block truncate text-zinc-400">{mappedFeatures.join(", ")}</p>
      <p className="hidden @[950px]/TrackList:block @[950px]/TrackList:col-start-6 text-center text-zinc-300">{convertDuration(track.duration)}</p>

      {/* Show the rating when NOT in a form */}
      {track.rating !== undefined && !hasChildren ? (
        <p className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-bold ${textColor}`}>{convertRatingToString(track.rating)}</p>
      ) : (
        <div className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-bold ${textColor}`}>{children}</div>
      )}
    </div>
  );
};

export default TrackCard;
