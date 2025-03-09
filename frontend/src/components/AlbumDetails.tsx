import { ReviewedAlbum, ReviewedArtist } from "@shared/types";
import ArtistLinkCard from "./ArtistLinkCard";

interface AlbumDetailsProps {
  album: ReviewedAlbum;
  artist: ReviewedArtist;
  trackCount: number;
}

const AlbumDetails = (props: AlbumDetailsProps) => {
  const { album, artist, trackCount } = props;
  return (
    <div className="w-[70%] mx-auto flex items-center my-4 justify-evenly">
      <div className="flex items-center justify-evenly gap-4">
        <ArtistLinkCard artist={artist} />
        <span className="mx-2">•</span>
        <p className="text-gray-400">{album.runtime}</p>
        <span className="mx-2">•</span>
        <p className="text-gray-400">{trackCount} tracks</p>
        <span className="mx-2">•</span>
        <p className="text-gray-400">{album.releaseDate}</p>
      </div>
      {/* <RatingChip rating={album.reviewScore} options={{ text: true }} /> */}
      {/* <p className="p-4 border-1 border-gray-400 rounded-lg font-light">{album.reviewContent}</p> */}
    </div>
  );
};

export default AlbumDetails;
