import { DisplayTrack, ReviewedAlbum } from "@shared/types";
import RatingChip from "./RatingChip";

interface ReviewDetailsProps {
  album: ReviewedAlbum;
  tracks: DisplayTrack[];
}

const ReviewDetails = (props: ReviewDetailsProps) => {
  const { album } = props;
  return (
    <div className="flex flex-col items-center justify-evenly w-[70%] mx-auto mb-8">
      {/* <div className="flex items-center gap-2"> */}
      <RatingChip rating={album.reviewScore} options={{ text: true }} />
      <BestWorstSong bestSong={album.bestSong} worstSong={album.worstSong} />
      {/* </div> bg-gradient-to-b ${gradientStart} via-zinc-800/40 to-zinc-800/40 */}
      <p className="p-3 rounded-lg bg-zinc-800/40">{album.reviewContent}</p>
    </div>
  );
};

export default ReviewDetails;

interface BestWorstSongProps {
  bestSong: string;
  worstSong: string;
}

const BestWorstSong = (props: BestWorstSongProps) => {
  const { bestSong, worstSong } = props;
  return (
    <div className="flex items-center gap-2 m-4">
      <div>
        <p className="text-emerald-500 text-xs tracking-wider">Best song</p>
        <p className="bg-emerald-500/60 p-2 rounded-lg text-center">{bestSong}</p>
      </div>
      <div>
        <p className="text-red-500 text-xs tracking-wide">Worst song</p>
        <p className="bg-red-500/60 p-2 rounded-lg text-center">{worstSong}</p>
      </div>
    </div>
  );
};
