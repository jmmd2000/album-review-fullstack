import { ReviewedAlbum } from "@shared/types";
import AlbumCard from "./AlbumCard";
import { useRef, useState, useEffect } from "react";

interface AlbumRowProps {
  albums: ReviewedAlbum[];
}

const AlbumRow = ({ albums }: AlbumRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    if (rowRef.current) {
      rowRef.current.addEventListener("scroll", checkScroll);
    }
    return () => {
      if (rowRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        rowRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, [albums]);

  if (!albums || albums.length === 0) {
    return null;
  }

  return (
    <div className="relative mx-4 my-8">
      {canScrollLeft && (
        <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full z-10" onClick={scrollLeft}>
          {"<"}
        </button>
      )}

      <div ref={rowRef} className="flex gap-4 overflow-x-scroll no-scrollbar scroll-smooth w-full max-w-[1900px] px-8">
        {albums.map((album) => (
          <div key={album.spotifyID} className="min-w-[240px]">
            <AlbumCard album={album} />
          </div>
        ))}
      </div>
      {canScrollRight && (
        <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full z-10" onClick={scrollRight}>
          {">"}
        </button>
      )}
    </div>
  );
};

export default AlbumRow;
