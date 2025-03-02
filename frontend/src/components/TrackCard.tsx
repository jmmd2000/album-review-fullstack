import { DisplayTrack } from "@shared/types";
import { convertDuration } from "../helpers/convertDuration";

interface TrackCardProps {
  track: DisplayTrack;
}

const TrackCard = (props: TrackCardProps) => {
  const { track } = props;

  const mappedFeatures = track.features.map((feature) => feature.name);
  return (
    <div className="grid grid-cols-5 @[850px]/TrackList:grid-cols-6 gap-2 bg-zinc-800 justify-between w-[90%] md:w-[70%] p-4 rounded-lg">
      <h2 className="col-span-3 @[850px]/TrackList:col-span-2 truncate">{track.name}</h2>
      <p className="col-start-4 @[850px]/TrackList:col-start-3 text-center">{track.artistName}</p>
      <p className="col-span-2 hidden @[850px]/TrackList:block truncate">{mappedFeatures.join(", ")}</p>
      <p className="col-start-5 @[850px]/TrackList:col-start-6 text-center">{convertDuration(track.duration)}</p>
    </div>
  );
};

export default TrackCard;
