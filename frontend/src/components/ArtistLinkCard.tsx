import { ReviewedArtist } from "@shared/types";
import { Link } from "@tanstack/react-router";

/**
 * The props for the ArtistLinkCard component.
 */
interface ArtistLinkCardProps {
  /** The artist data */
  artist: ReviewedArtist;
}

/**
 * This component creates a card for an artist with an image and name.
 * Usually displayed in the AlbumDetails component below the BlurryHeader.
 * @param {ReviewedArtist} artist The artist data
 */
const ArtistLinkCard = (props: ArtistLinkCardProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <img src={props.artist.imageURLs[2].url} alt={props.artist.name} className="rounded-full h-12 w-12 shadow-2xl" />
      <div className="flex gap-2 px-0 py-1">
        <Link params={{ artistID: props.artist.spotifyID }} to={"/artists/$artistID"} className="hover:underline text-gray-300 hover:text-gray-100 text-lg">
          {props.artist.name}
        </Link>
      </div>
    </div>
  );
};

export default ArtistLinkCard;
