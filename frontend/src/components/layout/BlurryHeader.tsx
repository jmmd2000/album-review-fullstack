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

  const mobileQuery = "(max-width: 768px)";
  const ultrawideQuery = "(min-width: 120.5rem)";

  const [tier, setTier] = useState<"mobile" | "desktop" | "ultrawide">(() => {
    if (typeof window === "undefined") return "desktop";
    if (window.matchMedia(mobileQuery).matches) return "mobile";
    if (window.matchMedia(ultrawideQuery).matches) return "ultrawide";
    return "desktop";
  });

  useEffect(() => {
    const mobile = window.matchMedia(mobileQuery);
    const ultrawide = window.matchMedia(ultrawideQuery);
    const update = () => {
      if (mobile.matches) setTier("mobile");
      else if (ultrawide.matches) setTier("ultrawide");
      else setTier("desktop");
    };
    mobile.addEventListener("change", update);
    ultrawide.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      ultrawide.removeEventListener("change", update);
    };
  }, []);

  const totalBlobs = tier === "mobile" ? 15 : tier === "ultrawide" ? 80 : 50;
  const colorCount = colors.length;

  // Generate blobs with proportional color distribution and better spread
  const blobs = useMemo(() => {
    const blobsArray = [];

    const columns = tier === "mobile" ? 3 : tier === "ultrawide" ? 7 : 5;
    const rows = tier === "mobile" ? 2 : tier === "ultrawide" ? 4 : 3;

    for (let i = 0; i < colorCount; i++) {
      const blobCount = Math.round((totalBlobs / colorCount) * (colorCount - i));

      for (let j = 0; j < blobCount; j++) {
        const gridCol = j % columns;
        const gridRow = Math.floor(j / columns) % rows;

        const baseLeft = gridCol * (100 / columns) + 100 / columns / 2;
        const baseTop = gridRow * (100 / rows) + 100 / rows / 2;

        const randomOffsetX = (Math.random() - 0.5) * (80 / columns);
        const randomOffsetY = (Math.random() - 0.5) * (60 / rows);

        const baseSize = tier === "mobile" ? 200 : tier === "ultrawide" ? 350 : 250;
        const randomSize = tier === "mobile" ? 150 : tier === "ultrawide" ? 350 : 250;
        blobsArray.push({
          size: Math.floor(Math.random() * randomSize) + baseSize,
          left: Math.max(0, Math.min(100, baseLeft + randomOffsetX)),
          top: Math.max(0, Math.min(100, baseTop + randomOffsetY)),
          color: colors[i].hex,
          blur:
            tier === "mobile"
              ? Math.floor(Math.random() * 40) + 30
              : tier === "ultrawide"
                ? Math.floor(Math.random() * 80) + 50
                : Math.floor(Math.random() * 60) + 40,
          opacity: Math.random() * 0.5 + 0.5,
          animationClass: `animate-lava${j % 3}`,
        });
      }
    }

    for (let i = blobsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blobsArray[i], blobsArray[j]] = [blobsArray[j], blobsArray[i]];
    }

    return blobsArray;
  }, [colorCount, colors, tier, totalBlobs]);

  return (
    <div className="relative w-full h-175 md:h-125 3xl:h-200 pb-28 3xl:pt-28 overflow-hidden bg-linear-to-b from-black/0 via-neutral-900/10 to-neutral-900 pointer-events-none">
      {blobs.map((blob, index) => (
        <div
          key={index}
          className={`absolute rounded-full -z-5 ${blob.animationClass} pointer-events-none`}
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
