import { DisplayTrack } from "@shared/types";
import TrackCard from "./TrackCard";

interface TrackListProps {
  tracks: DisplayTrack[];
}

const TrackList = (props: TrackListProps) => {
  const { tracks } = props;
  return <div className="flex flex-col gap-4 items-center @container/TrackList">{tracks && tracks.map((track) => <TrackCard key={track.spotifyID} track={track} />)}</div>;
};

export default TrackList;
