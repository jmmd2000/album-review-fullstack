import { DisplayTrack } from "@shared/types";
import { convertDuration } from "../helpers/convertDuration";
import { convertRatingToString } from "../helpers/convertRatingToString";
import { convertRatingToColor } from "../helpers/convertRatingToColor";
import { cva } from "class-variance-authority";

interface TrackCardProps {
  track: DisplayTrack;
}

const TrackCard = (props: TrackCardProps) => {
  const { track } = props;

  const mappedFeatures = track.features.map((feature) => feature.name);

  const gradientStart = convertRatingToColor(track.rating ?? -1, { gradient: true });
  const borderColor = convertRatingToColor(track.rating ?? -1, { border: true });
  const textColor = convertRatingToColor(track.rating ?? -1, { text: true });

  const trackCard = cva(["grid", "gap-2", "justify-between", "w-[90%]", "md:w-[70%]", "p-4", "rounded-lg", "bg-gradient-to-r", gradientStart, "via-zinc-800/40", "to-zinc-800/40", "border-1", borderColor], {
    variants: {
      rating: {
        true: "grid-cols-6 @[950px]/TrackList:grid-cols-7",
        false: "grid-cols-5 @[950px]/TrackList:grid-cols-6",
      },
    },
  });

  return (
    <div className={trackCard({ rating: track.rating !== undefined })}>
      <h2 className="col-span-3 @[950px]/TrackList:col-span-2 truncate ">{track.name}</h2>
      <p className="col-start-4 col-span-2 @[950px]/TrackList:col-start-3 @[950px]/TrackList:col-span-1 text-center text-zinc-300 truncate">{track.artistName}</p>
      <p className="col-span-2 hidden @[950px]/TrackList:block truncate">{mappedFeatures.join(", ")}</p>
      <p className="hidden @[950px]/TrackList:block @[950px]/TrackList:col-start-6 text-center">{convertDuration(track.duration)}</p>
      {track.rating !== undefined && <p className={`col-start-6 @[950px]/TrackList:col-start-7 text-center uppercase font-medium ${textColor}`}>{convertRatingToString(track.rating)}</p>}
    </div>
  );
};

export default TrackCard;
