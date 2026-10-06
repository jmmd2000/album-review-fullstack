import type { CSSProperties } from "react";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { formatDuration } from "@shared/helpers/formatDuration";
import type { DisplayTrack } from "@shared/types";
import { tierColourVar, tierFillVar } from "@/lib/tierColours";
import styles from "./Tracklist.module.css";

interface TracklistProps {
  tracks: DisplayTrack[];
  bestSong?: string;
  worstSong?: string;
}

const asPick = (value?: string): string | null => {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "-" ? trimmed.toLowerCase() : null;
};

export function Tracklist({ tracks, bestSong, worstSong }: TracklistProps) {
  const best = asPick(bestSong);
  const worst = asPick(worstSong);

  return (
    <section aria-labelledby="tracklist-heading">
      <h2 id="tracklist-heading" className={styles.label}>
        Tracklist
      </h2>
      <ol className={styles.list}>
        {tracks.map((track, index) => {
          const name = track.name.trim().toLowerCase();
          return <TrackRow key={track.spotifyID} track={track} position={index + 1} pick={best && name === best ? "best" : worst && name === worst ? "worst" : null} />;
        })}
      </ol>
    </section>
  );
}

interface TrackRowProps {
  track: DisplayTrack;
  position: number;
  pick: "best" | "worst" | null;
}

function TrackRow({ track, position, pick }: TrackRowProps) {
  // Track ratings are stored on a 1-10 scale, so scale to 0-100 for the tier.
  const rated = track.rating != null && track.rating > 0;
  const tier = rated ? scoreTier(track.rating! * 10) : "Unrated";
  const tierVar = tierColourVar(tier);

  return (
    <li className={styles.row} style={{ "--row-tier": tierVar } as CSSProperties}>
      <span className={styles.number}>{String(position).padStart(2, "0")}</span>
      <span className={styles.title}>
        <span className={styles.name}>{track.name}</span>
        {track.features.length > 0 && <span className={styles.features}> feat. {track.features.map(feature => feature.name).join(", ")}</span>}
        {pick && (
          <span className={styles.pick} data-kind={pick}>
            {pick === "best" ? "Best" : "Worst"}
          </span>
        )}
      </span>
      <span className={styles.duration}>{formatDuration(track.duration, "short")}</span>
      <span className={styles.tier} data-unrated={!rated} style={rated ? { backgroundColor: tierFillVar(tier) } : undefined}>
        {tier}
      </span>
    </li>
  );
}
