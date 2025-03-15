import { ReviewedAlbum } from "@shared/types";
import AlbumCard from "./AlbumCard";
import { useRef } from "react";

interface AlbumRowProps {
  albums: ReviewedAlbum[];
}

const AlbumRow = (props: AlbumRowProps) => {
  const { albums } = props;
  const rowRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="relative mx-4 my-8">
      <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full" onClick={scrollLeft}>
        {"<"}
      </button>
      <div ref={rowRef} className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] max-w-[1900px] gap-4 place-items-center overflow-x-auto scrollbar-hide">
        {albums.map((album) => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
      </div>
      <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full" onClick={scrollRight}>
        {">"}
      </button>
    </div>
  );
};

export default AlbumRow;
