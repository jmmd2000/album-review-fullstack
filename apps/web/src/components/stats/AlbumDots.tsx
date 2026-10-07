import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ratingTiers, scoreTier } from "@shared/helpers/ratingTiers";
import { tierColourVar } from "@/lib/tierColours";
import { ScoreChip } from "@/components/ui/ScoreChip";
import styles from "./AlbumDots.module.css";

import type { CSSProperties } from "react";
import type { TierLabel } from "@shared/helpers/ratingTiers";
import type { StatsAlbum } from "@shared/types";

const TOOLTIP_WIDTH = 300;

/** Terrible to Perfect, one tenth of the chart each */
const scoredTiers = ratingTiers.filter(tier => tier.label !== "Unrated");

interface Tooltip {
  album: StatsAlbum;
  left: number;
  top: number;
}

interface AlbumDotsProps {
  /** The albums, lowest score first */
  albums: StatsAlbum[];
  /** The IDs of the albums the filters pick. The rest fade back. */
  matchingIDs: Set<string>;
}

/**
 * Every album as a dot in its tier colour. Each tier's albums stack in that tier's tenth of the width,
 * from the bottom up and lowest score first, so a stack's height is how many albums landed in the tier.
 * Hovering or focusing a dot shows the album in a tooltip.
 */
export function AlbumDots({ albums, matchingIDs }: AlbumDotsProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const showTooltip = (album: StatsAlbum, dot: HTMLElement) => {
    const plot = plotRef.current;
    if (!plot) return;
    const plotBox = plot.getBoundingClientRect();
    const dotBox = dot.getBoundingClientRect();
    const centred = dotBox.left - plotBox.left + dotBox.width / 2 - TOOLTIP_WIDTH / 2;
    const left = Math.max(0, Math.min(centred, plotBox.width - TOOLTIP_WIDTH));
    setTooltip({ album, left, top: dotBox.top - plotBox.top - 12 });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <div ref={plotRef} className={styles.plot}>
      <div className={styles.columns}>
        {scoredTiers.map((tier, tierIndex) => (
          <ul key={tier.label} className={styles.column} style={{ "--tier-index": tierIndex } as CSSProperties} aria-label={`${tier.label}, ${tier.range[0]} to ${tier.range[1]}`}>
            {albums
              .filter(album => scoreTier(album.finalScore) === tier.label)
              .map((album, order) => (
                <li key={album.spotifyID} style={{ "--order": order } as CSSProperties}>
                  <Link
                    to="/albums/$albumID"
                    params={{ albumID: album.spotifyID }}
                    className={matchingIDs.has(album.spotifyID) ? styles.dot : `${styles.dot} ${styles.dim}`}
                    style={tierStyle(tier.label)}
                    aria-label={`${album.name} by ${album.artistName}, ${Math.ceil(album.finalScore)}`}
                    onMouseEnter={event => showTooltip(album, event.currentTarget)}
                    onFocus={event => showTooltip(album, event.currentTarget)}
                    onMouseLeave={hideTooltip}
                    onBlur={hideTooltip}
                  />
                </li>
              ))}
          </ul>
        ))}
      </div>

      <div className={styles.ruler} aria-hidden="true">
        {scoredTiers.map(tier => (
          <span key={tier.label} style={tierStyle(tier.label)} title={`${tier.range[0]} to ${tier.range[1]}`}>
            {tier.label}
          </span>
        ))}
      </div>

      {tooltip && <AlbumTooltip {...tooltip} />}
    </div>
  );
}

function tierStyle(tier: TierLabel): CSSProperties {
  return { "--tier": tierColourVar(tier) } as CSSProperties;
}

function AlbumTooltip({ album, left, top }: Tooltip) {
  const cover = album.imageURLs[1] ?? album.imageURLs[0];

  return (
    <div className={styles.tooltip} style={{ left, top }} aria-hidden="true">
      {cover ? <img src={cover.url} alt="" width={52} height={52} /> : <span />}
      <div className={styles.tooltipText}>
        <b>{album.name}</b>
        <span>
          {album.artistName}, {album.releaseYear}
        </span>
      </div>
      <ScoreChip score={album.finalScore} />
    </div>
  );
}
