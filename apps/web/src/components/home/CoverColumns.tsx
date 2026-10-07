import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { usableCoverColours } from "@/lib/coverColours";
import { morphProps } from "@/lib/coverMorph";
import styles from "./CoverColumns.module.css";

import type { CSSProperties } from "react";
import type { HomeAlbum } from "@shared/types";

const COLUMN_COUNT = 4;
/** Enough to run past the bottom of a tall screen, so a column never shows a gap */
const COVERS_PER_COLUMN = 16;

interface CoverColumnsProps {
  albums: HomeAlbum[];
  /** Called with the album under the pointer or focus, and with null when it leaves */
  onHover: (album: HomeAlbum | null) => void;
}

/**
 * Deals the albums into columns, one at a time, left to right.
 * A sample smaller than the columns can hold starts again from the first album.
 */
function dealColumns(albums: HomeAlbum[]): HomeAlbum[][] {
  const columns: HomeAlbum[][] = [];
  for (let columnIndex = 0; columnIndex < COLUMN_COUNT; columnIndex++) {
    const column: HomeAlbum[] = [];
    for (let row = 0; row < COVERS_PER_COLUMN; row++) {
      column.push(albums[(row * COLUMN_COUNT + columnIndex) % albums.length]);
    }
    columns.push(column);
  }
  return columns;
}

/**
 * The home page's columns of covers, drifting up and down without end.
 * Each column holds its covers twice and moves up by one set, so the loop has no seam.
 */
export const CoverColumns = memo(function CoverColumns({ albums, onHover }: CoverColumnsProps) {
  if (albums.length === 0) return null;

  // A small sample repeats covers, and only one copy of a cover may be the one that lands from its album page
  const landingIDs = new Set<string>();
  const canLand = (album: HomeAlbum) => {
    if (landingIDs.has(album.spotifyID)) return false;
    landingIDs.add(album.spotifyID);
    return true;
  };

  return (
    <div className={styles.columns}>
      {dealColumns(albums).map((column, columnIndex) => (
        <div key={columnIndex} className={styles.column}>
          <div className={styles.track}>
            {column.map((album, row) => (
              <Cover key={row} album={album} onHover={onHover} canLand={canLand(album)} />
            ))}
            {column.map((album, row) => (
              <Cover key={`copy-${row}`} album={album} onHover={onHover} isCopy />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

interface CoverProps {
  album: HomeAlbum;
  onHover: (album: HomeAlbum | null) => void;
  /** The second set of covers in a column, which screen readers and the Tab key skip */
  isCopy?: boolean;
  /** Whether this is the copy the cover lands on when coming back from its album page */
  canLand?: boolean;
}

function Cover({ album, onHover, isCopy = false, canLand = false }: CoverProps) {
  const image = album.imageURLs[1] ?? album.imageURLs[0];
  const largeImage = album.imageURLs[0];
  const shade = usableCoverColours(album.colors)[0];
  // 80 is 50% opacity. Chrome can only animate a plain colour in a filter, so the CSS can't mix it in.
  const style = shade ? ({ "--shade": `${shade}80` } as CSSProperties) : undefined;

  return (
    <Link
      to="/albums/$albumID"
      params={{ albumID: album.spotifyID }}
      className={styles.cover}
      style={style}
      aria-label={`${album.name} by ${album.artistName}`}
      aria-hidden={isCopy || undefined}
      tabIndex={isCopy ? -1 : undefined}
      onMouseEnter={() => onHover(album)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(album)}
      onBlur={() => onHover(null)}
    >
      {image ? (
        // Not lazy: a lazy image isn't painted yet when the browser pictures the page, so the covers would be blank as one flies home
        <img src={image.url} srcSet={largeImage ? `${largeImage.url} 2x` : undefined} alt="" width={image.width} height={image.height} {...morphProps("album", album.spotifyID, canLand)} />
      ) : (
        <span className={styles.missing} aria-hidden="true">
          {album.name.trim().charAt(0)}
        </span>
      )}
    </Link>
  );
}
