import { DisplayAlbum } from "@shared/types";
import { Link } from "@tanstack/react-router";
import RatingChip from "./RatingChip";

/**
 * The props for the AlbumCard component.
 */
interface AlbumCardProps {
  /** The album to display */
  album: DisplayAlbum;
}

/**
 * This component creates a card for an album with an image, name, artist, and review score.
 * @param {DisplayAlbum} album The album to display
 */
const AlbumCard = ({ album }: AlbumCardProps) => {
  return (
    <Link params={{ albumID: album.spotifyID }} to="/albums/$albumID" viewTransition className="block">
      <div className="flex flex-col rounded-xl items-center w-full max-w-[240px]">
        {/* <div className="h-[240px] w-[240px] overflow-hidden"> */}
        <img src={album.imageURLs[1].url} alt={album.name} className="w-full aspect-square rounded-lg" style={{ viewTransitionName: `album-image-${album.spotifyID}` }} />
        {/* </div> */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col px-0 py-1 w-[90%] relative">
            <h2 className="w-full max-w-[160px] text-sm font-medium truncate">{album.name}</h2>
            <p className="text-xs text-gray-500">{album.artistName}</p>
          </div>
          {album.reviewScore && (
            <div className="grid place-items-center">
              <RatingChip rating={album.reviewScore} options={{ small: true }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default AlbumCard;
