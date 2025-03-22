import { DisplayAlbum } from "@shared/types";
import { useState } from "react";

interface AlbumScrollerProps {
  albums: DisplayAlbum[];
}

const AlbumScroller = ({ albums }: AlbumScrollerProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Repeat the albums enough times to make animation loop look natural
  const repeatingAlbums = [...albums, ...albums, ...albums];

  return (
    <div className="absolute bottom-0 w-full overflow-hidden no-scrollbar pt-16 lg:pt-20">
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none z-10"></div>
      <div className={`flex will-change-transform animate-infinite-scroll ${hoveredIndex !== null ? "pause-animation" : ""}`} style={{ width: "max-content" }}>
        {repeatingAlbums.map((album, i) => (
          <img
            key={`${album.spotifyID}-${i}`}
            src={album.imageURLs[0]?.url}
            alt={album.name}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`h-28 w-28 -ml-12 md:h-36 md:w-36 md:-ml-12 lg:h-40 lg:w-40 lg:-ml-16 xl:h-60 xl:w-60  skew-y-6 rotate-1 object-cover rounded-lg shadow-md shrink-0 transition-transform duration-300 ${hoveredIndex === i ? "-translate-y-12 scale-105" : ""}`}
            style={{
              zIndex: 1000 - i,
            }}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default AlbumScroller;
