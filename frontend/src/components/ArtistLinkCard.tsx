import { ReviewedArtist, SpotifyArtist } from "@shared/types";
import { Link } from "@tanstack/react-router";

/**
 * The props for the ArtistLinkCard component.
 */
interface ArtistLinkCardProps {
  /** The artist data */
  artist: ReviewedArtist | SpotifyArtist;
}

// Type guard to check if the artist is a ReviewedArtist
const isReviewedArtist = (artist: SpotifyArtist | ReviewedArtist): artist is ReviewedArtist => {
  return (artist as ReviewedArtist).imageURLs !== undefined;
};

/**
 * This component creates a card for an artist with an image and name.
 * Usually displayed in the AlbumDetails component below the BlurryHeader.
 * @param {ReviewedArtist | SpotifyArtist} artist The artist data
 */
const ArtistLinkCard = ({ artist }: ArtistLinkCardProps) => {
  const imageURL = isReviewedArtist(artist) ? artist.imageURLs[2].url : artist.images[2].url;
  const spotifyID = isReviewedArtist(artist) ? artist.spotifyID : artist.id;
  const name = isReviewedArtist(artist) ? artist.name : artist.name;

  console.log(isReviewedArtist(artist), spotifyID);
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <img src={imageURL} alt={artist.name} className="rounded-lg h-10 w-10 md:h-12 md:w-12 shadow-2xl" style={{ viewTransitionName: `artist-image-${spotifyID}` }} />
      <div className="flex gap-2 px-0 py-1">
        {isReviewedArtist(artist) ? (
          <Link params={{ artistID: spotifyID }} to="/artists/$artistID" className="hover:underline text-gray-300 hover:text-gray-100 text-sm md:text-lg z-50" viewTransition style={{ viewTransitionName: `artist-image-` }}>
            {name}
          </Link>
        ) : (
          <p className="text-gray-300 text-sm md:text-lg">{name}</p>
        )}
      </div>
    </div>
  );
};

export default ArtistLinkCard;
