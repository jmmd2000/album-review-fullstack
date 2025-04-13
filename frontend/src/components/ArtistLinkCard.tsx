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
const ArtistLinkCard = ({ artist }: ArtistLinkCardProps) => {
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <img src={artist.imageURLs[2].url} alt={artist.name} className="rounded-lg h-10 w-10 md:h-12 md:w-12 shadow-2xl" style={{ viewTransitionName: `artist-image-${artist.spotifyID}` }} />
      <div className="flex gap-2 px-0 py-1">
        <Link params={{ artistID: artist.spotifyID }} to={"/artists/$artistID"} className="hover:underline text-gray-300 hover:text-gray-100 text-sm md:text-lg" viewTransition style={{ viewTransitionName: `artist-image-` }}>
          {artist.name}
        </Link>
      </div>
    </div>
  );
};

export default ArtistLinkCard;
