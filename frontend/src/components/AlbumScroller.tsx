import { DisplayAlbum } from "@shared/types";
import { useMemo } from "react";

interface AlbumScrollerProps {
  albums: DisplayAlbum[];
}

const AlbumScroller = ({ albums }: AlbumScrollerProps) => {
  // Randomize album order once on component mount
  const randomizedAlbums = useMemo(() => {
    const shuffled = [...albums].sort(() => Math.random() - 0.5);
    // Create 6 sets of the randomized albums for smooth infinite scroll
    return [
      ...shuffled,
      ...shuffled,
      ...shuffled,
      ...shuffled,
      ...shuffled,
      ...shuffled,
    ];
  }, [albums]);

  return (
    <>
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          zIndex: 1,
        }}
      >
        {/* scrolling container with grid */}
        <div
          className="absolute grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 gap-1 sm:gap-2 p-2 sm:p-4 scrolling-container"
          style={{
            width: "100%",
            height: "600%",
          }}
        >
          {randomizedAlbums.map((album, i) => (
            <img
              key={`${album.spotifyID}-${i}`}
              src={album.imageURLs[0]?.url}
              alt={album.name}
              className="w-full h-auto aspect-square object-cover rounded shadow-lg"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default AlbumScroller;
