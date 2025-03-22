import { ReviewedAlbum, ReviewedArtist } from "@shared/types";
import ArtistLinkCard from "@components/ArtistLinkCard";

/**
 * The props for the AlbumDetails component.
 */
interface AlbumDetailsProps {
  /** The album being reviewed */
  album: ReviewedAlbum;
  /** The artist of the album */
  artist: ReviewedArtist;
  /** The number of tracks on the album */
  trackCount: number;
}

/**
 * This component creates a detail section for an album with the artist, runtime, track count, and release date.
 * Usuaully displayed sits below the BlurryHeader on the AlbumDetail page.
 * @param {ReviewedAlbum} album The album being reviewed
 * @param {ReviewedArtist} artist The artist of the album
 * @param {number} trackCount The number of tracks on the album
 */
const AlbumDetails = ({ album, artist, trackCount }: AlbumDetailsProps) => {
  return (
    <div className="w-[70%] mx-auto flex items-center justify-evenly">
      <div className="flex items-center justify-evenly gap-4">
        <ArtistLinkCard artist={artist} />
        <span className="mx-2">•</span>
        <p className="text-gray-400">{album.runtime}</p>
        <span className="mx-2">•</span>
        <p className="text-gray-400">{trackCount} tracks</p>
        <span className="mx-2">•</span>
        <p className="text-gray-400">{album.releaseDate}</p>
      </div>
    </div>
  );
};

export default AlbumDetails;
