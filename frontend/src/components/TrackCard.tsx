import { ReviewedTrack } from "@shared/types";

interface TrackCardProps {
  track: ReviewedTrack;
}

const TrackCard = (props: TrackCardProps) => {
  const { track } = props;
  return (
    <div>
      <h1>{track.name}</h1>
      <p>{track.duration}</p>
    </div>
  );
};

export default TrackCard;
