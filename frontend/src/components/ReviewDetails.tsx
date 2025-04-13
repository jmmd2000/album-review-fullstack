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
    <div className="flex flex-col items-center justify-evenly w-[90%] md:w-[80ch] mx-auto mb-8">
      <RatingChip rating={album.reviewScore} options={{ textBelow: true }} />
      <BestWorstSong bestSong={album.bestSong} worstSong={album.worstSong} />
      <div className="w-full mt-6 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900/40 overflow-hidden">
        <div className="relative px-5 py-4 border-l-4 border-neutral-800">
          <blockquote className="text-zinc-200 text-sm sm:text-base font-light">
            <p className="leading-relaxed">{album.reviewContent}</p>
          </blockquote>
        </div>
      </div>
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 my-6 w-3/5 sm:w-full max-w-xl">
      <div className="flex-1 rounded-lg overflow-hidden border-2 border-emerald-500/30 shadow-sm">
        <div className="bg-emerald-500/20 px-3 py-1.5">
          <p className="text-emerald-400 text-xs font-medium tracking-wider uppercase flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
            Best Track
          </p>
        </div>
        <p className="p-3 text-center font-medium text-emerald-50 bg-gradient-to-b from-emerald-900/40 to-transparent">{bestSong}</p>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border-2 border-red-500/30 shadow-sm">
        <div className="bg-red-500/20 px-3 py-1.5">
          <p className="text-red-400 text-xs font-medium tracking-wider uppercase flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2"></span>
            Worst Track
          </p>
        </div>
        <p className="p-3 text-center font-medium text-red-50 bg-gradient-to-b from-red-900/40 to-transparent">{worstSong}</p>
      </div>
    </div>
  );
};
