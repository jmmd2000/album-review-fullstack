import { scoreTier } from "@shared/helpers/ratingTiers";
import { formatDuration } from "@shared/helpers/formatDuration";
import { splitFeatures } from "@/lib/trackFeatures";
import { describePlays } from "@/lib/listening";
import { PickChip } from "@/components/track/PickChip";
import { TierWordChip } from "@/components/ui/TierWordChip";
import styles from "./Tracklist.module.css";

import type { DisplayTrack } from "@shared/types";

interface TracklistProps {
  tracks: DisplayTrack[];
  /** The admin's plays of each track by Spotify ID, or null while they load. Visitors get none, and see no plays column. */
  plays?: Record<string, number> | null;
}

/** An album's tracks in album order, one line each, with the rating as a tier word chip. */
export function Tracklist({ tracks, plays }: TracklistProps) {
  return (
    <section aria-labelledby="tracklist-heading">
      <h2 id="tracklist-heading" className={styles.heading}>
        {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
      </h2>
      <ol className={styles.list}>
        {tracks.map((track, index) => (
          <TrackRow key={track.spotifyID} track={track} position={index + 1} plays={plays === undefined ? undefined : (plays?.[track.spotifyID] ?? null)} />
        ))}
      </ol>
    </section>
  );
}

interface TrackRowProps {
  track: DisplayTrack;
  position: number;
  plays?: number | null;
}

function TrackRow({ track, position, plays }: TrackRowProps) {
  // Track ratings are stored on a 1-10 scale, so scale to 0-100 for the tier.
  const rating = track.rating ?? 0;
  const tier = rating > 0 ? scoreTier(rating * 10) : "Unrated";
  const { title, featuring } = splitFeatures(track.name, track.features);

  return (
    <li className={plays === undefined ? styles.row : `${styles.row} ${styles.withPlays}`}>
      <span className={styles.number}>{position}</span>
      <span className={styles.name}>
        {title}
        {featuring.length > 0 && <span className={styles.features}> feat. {featuring.join(", ")}</span>}
        {track.pick && (
          <>
            {" "}
            <PickChip pick={track.pick} />
          </>
        )}
      </span>
      {plays !== undefined && <span className={styles.plays}>{plays === null ? "–" : describePlays(plays)}</span>}
      <span className={styles.duration}>{formatDuration(track.duration, "short")}</span>
      <TierWordChip tier={tier}>{tier}</TierWordChip>
    </li>
  );
}
