import { ReviewedAlbum, ReviewedArtist, SpotifyAlbum, SpotifyArtist } from "@shared/types";
import ArtistLinkCard from "@components/ArtistLinkCard";
import getTotalDuration from "@shared/helpers/formatDuration";
import { formatDate } from "@shared/helpers/formatDate";

/**
 * The props for the AlbumDetails component.
 */
interface AlbumDetailsProps {
  /** The album being reviewed */
  album: ReviewedAlbum | SpotifyAlbum;
  /** The artist of the album */
  artist: ReviewedArtist | SpotifyArtist;
  /** The number of tracks on the album */
  trackCount: number;
}

// Type guard to check if the album is a ReviewedAlbum
const isReviewedAlbum = (album: SpotifyAlbum | ReviewedAlbum): album is ReviewedAlbum => {
  return (album as ReviewedAlbum).reviewScore !== undefined;
};

/**
 * This component creates a detail section for an album with the artist, runtime, track count, and release date.
 * Usually displayed below the BlurryHeader on the AlbumDetail page.
 * @param {ReviewedAlbum | SpotifyAlbum} album The album being reviewed
 * @param {ReviewedArtist | SpotifyArtist} artist The artist of the album
 * @param {number} trackCount The number of tracks on the album
 */
const AlbumDetails = ({ album, artist, trackCount }: AlbumDetailsProps) => {
  const runtime = isReviewedAlbum(album) ? album.runtime : getTotalDuration(album);
  const releaseDate = isReviewedAlbum(album) ? album.releaseDate : formatDate(album.release_date);
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
          <p className="text-gray-400">{runtime}</p>
          <span className="mx-2 text-gray-500">•</span>
          <p className="text-gray-400">{trackCount} tracks</p>
          <span className="mx-2 text-gray-500">•</span>
          <p className="text-gray-400">{releaseDate}</p>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;
