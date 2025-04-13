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
    <div className="w-full mt-4 md:mt-0 px-4 md:w-[90%] lg:w-[70%] mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-evenly gap-3 py-2">
        <div className="md:hidden">
          <ArtistLinkCard artist={artist} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base">
          <div className="hidden md:block">
            <ArtistLinkCard artist={artist} />
          </div>
          <span className="hidden sm:inline mx-2 text-gray-500">•</span>
          <p className="text-gray-400">{album.runtime}</p>
          <span className="mx-2 text-gray-500">•</span>
          <p className="text-gray-400">{trackCount} tracks</p>
          <span className="mx-2 text-gray-500">•</span>
          <p className="text-gray-400">{album.releaseDate}</p>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;
