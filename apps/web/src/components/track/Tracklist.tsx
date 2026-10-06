import { scoreTier } from "@shared/helpers/ratingTiers";
import { formatDuration } from "@shared/helpers/formatDuration";
import { tierFillVar } from "@/lib/tierColours";
import { splitFeatures } from "@/lib/trackFeatures";
import { PickChip } from "@/components/track/PickChip";
import styles from "./Tracklist.module.css";

import type { DisplayTrack } from "@shared/types";

interface TracklistProps {
  tracks: DisplayTrack[];
}

/** An album's tracks in album order, one line each, with the rating as a tier word chip. */
export function Tracklist({ tracks }: TracklistProps) {
  return (
    <section aria-labelledby="tracklist-heading">
      <h2 id="tracklist-heading" className={styles.heading}>
        {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
      </h2>
      <ol className={styles.list}>
        {tracks.map((track, index) => (
          <TrackRow key={track.spotifyID} track={track} position={index + 1} />
        ))}
      </ol>
    </section>
  );
}

interface TrackRowProps {
  track: DisplayTrack;
  position: number;
}

function TrackRow({ track, position }: TrackRowProps) {
  // Track ratings are stored on a 1-10 scale, so scale to 0-100 for the tier.
  const rated = track.rating != null && track.rating > 0;
  const tier = rated ? scoreTier(track.rating! * 10) : "Unrated";
  const { title, featuring } = splitFeatures(track.name, track.features);

  return (
    <li className={styles.row}>
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
      <span className={styles.duration}>{formatDuration(track.duration, "short")}</span>
      <span className={styles.rating} style={{ backgroundColor: tierFillVar(tier) }}>
        {tier}
      </span>
    </li>
  );
}
