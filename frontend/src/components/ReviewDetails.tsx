import { DisplayTrack, ReviewedAlbum } from "@shared/types";
import RatingChip from "./RatingChip";

/**
 * The props for the ReviewDetails component.
 */
interface ReviewDetailsProps {
  /** The album being reviewed */
  album: ReviewedAlbum;
  /** The tracks on the album */
  tracks: DisplayTrack[];
}

/**
 * This component displays the review content, best and worst song, and rating for the album.
 * @param {ReviewedAlbum} album The album being reviewed
 * @param {DisplayTrack[]} tracks The tracks on the album
 */
const ReviewDetails = ({ album }: ReviewDetailsProps) => {
  return (
    <div className="flex flex-col items-center justify-evenly w-[70%] mx-auto mb-8">
      {/* <div className="flex items-center gap-2"> */}
      <RatingChip rating={album.reviewScore} options={{ textBelow: true }} />
      <BestWorstSong bestSong={album.bestSong} worstSong={album.worstSong} />
      {/* </div> bg-gradient-to-b ${gradientStart} via-zinc-800/40 to-zinc-800/40 */}
      <p className="p-3 rounded-lg bg-zinc-800/40">{album.reviewContent}</p>
    </div>
  );
};

export default ReviewDetails;

/**
 * The props for the BestWorstSong component.
 */
interface BestWorstSongProps {
  /** The best song on the album */
  bestSong: string;
  /** The worst song on the album */
  worstSong: string;
}

/**
 * This component displays the best and worst song on the album.
 * @param {string} bestSong The best song on the album
 * @param {string} worstSong The worst song on the album
 */
const BestWorstSong = ({ bestSong, worstSong }: BestWorstSongProps) => {
  return (
    <div className="flex items-center gap-2 m-4">
      <div>
        <p className="text-emerald-500 text-xs tracking-wider uppercase">Best song</p>
        <p className="bg-emerald-500/60 p-2 rounded-lg text-center">{bestSong}</p>
      </div>
      <div>
        <p className="text-red-500 text-xs tracking-wide uppercase">Worst song</p>
        <p className="bg-red-500/60 p-2 rounded-lg text-center">{worstSong}</p>
      </div>
    </div>
  );
};
