import { DisplayTrack } from "@shared/types";
import { convertDuration } from "@/helpers/convertDuration";
import { cva } from "class-variance-authority";
import { getRatingStyles } from "@/helpers/getRatingStyles";

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
  // console.log(track);
  const mappedFeatures = track.features.map((feature) => feature.name);
  const { label, gradientStart, textColor } = getRatingStyles(track.rating !== undefined ? track.rating * 10 : undefined);

  const trackCard = cva(["grid", "gap-2", "justify-between", "p-4", "bg-gradient-to-l", gradientStart, "via-neutral-900/60", "to-neutral-900", "rounded-lg"], {
    variants: {
      rating: {
        true: "grid-cols-6 @[950px]/TrackList:grid-cols-7",
        false: "grid-cols-5 @[950px]/TrackList:grid-cols-6",
      },
    },
  });

  const hasChildren = children !== undefined && children !== null && children !== false;

  return (
    <div className={`p-[2px] rounded-lg bg-gradient-to-r ${gradientStart} to-neutral-900 w-[90%] md:w-[70%]`}>
      <div className={trackCard({ rating: track.rating !== undefined })}>
        <h2 className="col-span-3 @[950px]/TrackList:col-span-2 truncate">{track.name}</h2>
        <p className="col-start-4 col-span-2 @[950px]/TrackList:col-start-3 @[950px]/TrackList:col-span-1 text-center text-zinc-300 truncate">{track.artistName}</p>
        <p className="col-span-2 hidden @[950px]/TrackList:block truncate text-zinc-400">{mappedFeatures.join(", ")}</p>
        <p className="hidden @[950px]/TrackList:block @[950px]/TrackList:col-start-6 text-center text-zinc-300">{convertDuration(track.duration)}</p>

        {track.rating !== undefined && !hasChildren ? (
          <p className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-bold ${textColor}`}>{label}</p>
        ) : (
          <div className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-bold ${textColor}`}>{children}</div>
        )}
      </div>
    </div>
  );
};

export default TrackCard;
