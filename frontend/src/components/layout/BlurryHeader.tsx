import { ExtractedColor } from "@shared/types";
import { useEffect, useMemo, useState } from "react";

/**
 * The props for the BlurryHeader component.
 */
interface BlobBackgroundProps {
  /*** The colors to use for the blobs */
  _colors?: ExtractedColor[];
  /*** The children to render on top of the blobs */
  children?: React.ReactNode;
}

/**
 * Optimized version of BlurryHeader that performs better on mobile devices
 * while maintaining the original visual distribution and animations.
 */
const BlurryHeader = ({ _colors, children }: BlobBackgroundProps) => {
  const defaultColors: ExtractedColor[] = [{ hex: "#00ffff" }];
  const colors = _colors && _colors.length > 0 ? _colors : defaultColors;

  // Track viewport size to adjust blob count responsively
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const totalBlobs = isMobile ? 15 : 50;
  const colorCount = colors.length;

  // Generate blobs with proportional color distribution and better spread
  const blobs = useMemo(() => {
    const blobsArray = [];

    // Create a grid for better distribution
    const columns = isMobile ? 3 : 5;
    const rows = isMobile ? 2 : 3;

    for (let i = 0; i < colorCount; i++) {
      const blobCount = Math.round((totalBlobs / colorCount) * (colorCount - i));

      for (let j = 0; j < blobCount; j++) {
        // Calculate position based on grid to ensure better distribution
        const gridCol = j % columns;
        const gridRow = Math.floor(j / columns) % rows;

        // Base positions from grid with some randomness
        const baseLeft = gridCol * (100 / columns) + 100 / columns / 2;
        const baseTop = gridRow * (100 / rows) + 100 / rows / 2;

        // Add randomness but keep within the cell area
        const randomOffsetX = (Math.random() - 0.5) * (80 / columns);
        const randomOffsetY = (Math.random() - 0.5) * (60 / rows);

        const baseSize = isMobile ? 200 : 250;
        const randomSize = isMobile ? 150 : 250;
        blobsArray.push({
          size: Math.floor(Math.random() * randomSize) + baseSize,
          left: Math.max(0, Math.min(100, baseLeft + randomOffsetX)),
          top: Math.max(0, Math.min(100, baseTop + randomOffsetY)),
          color: colors[i].hex,
          blur: isMobile ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 60) + 40,
          opacity: Math.random() * 0.5 + 0.5, // Back to original opacity range
          animationClass: `animate-lava${j % 3}`, // Original animation classes
        });
      }
    }

    // Shuffle to add randomness to the z-index layering
    for (let i = blobsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blobsArray[i], blobsArray[j]] = [blobsArray[j], blobsArray[i]];
    }

    return blobsArray;
  }, [colorCount, colors, isMobile, totalBlobs]);

  return (
    <div className="relative w-full h-[700px] md:h-[500px] pb-28 overflow-hidden bg-gradient-to-b from-black/0 via-neutral-900/10 to-neutral-900 pointer-events-none">
      {blobs.map((blob, index) => (
        <div
          key={index}
          className={`absolute rounded-full -z-[5] ${blob.animationClass} pointer-events-none`}
          style={{
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            position: "absolute",
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            transform: "translate(-50%, -50%) translateZ(0)", // Added hardware acceleration
            filter: `blur(${blob.blur}px)`,
            opacity: blob.opacity,
            backgroundColor: blob.color,
            willChange: "transform, opacity, filter",
          }}
        ></div>
      ))}
      {/* pointer-events-none on parent div was breaking element interaction */}
      <div className="pointer-events-auto contents">{children}</div>
    </div>
  );
};

export default BlurryHeader;
