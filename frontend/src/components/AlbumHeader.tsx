import { ReviewedAlbum, ReviewedArtist, SpotifyImage } from "@shared/types";

interface AlbumHeaderProps {
  /*** The album review data */
  album: ReviewedAlbum;
  /*** The artist data */
  artist: ReviewedArtist;
}

/**
 * This component is used to display the album cover and artist name on album detail pages
 */
const AlbumHeader = (props: AlbumHeaderProps) => {
  const { album, artist } = props;
  const imageURLs = JSON.parse(album.imageURLs) as SpotifyImage[];
  const albumImageURL = imageURLs[1].url;
  return (
    <div className="text-gray-100 max-w-[60%] mx-auto p-5 flex h-full items-center justify-center gap-8 px-16">
      <img src={albumImageURL} alt={album.name} className="rounded-lg h-72 w-72 shadow-2xl" />
      <div className="flex flex-col gap-2 px-0 py-1 relative">
        <h1 className="text-6xl font-bold drop-shadow-lg">{album.name}</h1>
        <p className=" text-gray-200 text-2xl drop-shadow-lg">{artist.name}</p>
      </div>
    </div>
  );
};

export default AlbumHeader;
