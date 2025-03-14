import { DisplayTrack } from "@shared/types";
import TrackCard from "@components/TrackCard";

/**
 * The props for the TrackList component.
 */
interface TrackListProps {
  /** The tracks to display */
  tracks: DisplayTrack[];
}

/**
 * This component creates a list of TrackCards.
 * @param {DisplayTrack[]} tracks The tracks to display
 */
const TrackList = (props: TrackListProps) => {
  const { tracks } = props;
  return <div className="flex flex-col gap-4 mb-8 items-center @container/TrackList">{tracks && tracks.map((track) => <TrackCard key={track.spotifyID} track={track} />)}</div>;
};

export default TrackList;
