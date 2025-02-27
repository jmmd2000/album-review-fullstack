import { ReviewedAlbum, ReviewedArtist, SpotifyImage } from "@shared/types";

interface AlbumHeaderProps {
  album: ReviewedAlbum;
  artist: ReviewedArtist;
}

const AlbumHeader = (props: AlbumHeaderProps) => {
  const { album, artist } = props;
  const imageURLs = JSON.parse(album.imageURLs) as SpotifyImage[];
  const albumImageURL = imageURLs[1].url;
  return (
    <div className="text-white p-5 flex h-full items-center gap-8 px-16">
      <img src={albumImageURL} alt={album.name} className="rounded-lg h-72 w-72 shadow-2xl" />
      <div className="flex flex-col px-0 py-1 w-[90%] relative">
        <h1 className="text-2xl font-bold">{album.name}</h1>
        <p className="text-sm text-gray-500">{artist.name}</p>
      </div>
    </div>
  );
};

export default AlbumHeader;
