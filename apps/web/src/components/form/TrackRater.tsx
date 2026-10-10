import { useState } from "react";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { formatDuration } from "@shared/helpers/formatDuration";
import { tierFillVar } from "@/lib/tierColours";
import { splitFeatures } from "@/lib/trackFeatures";
import { RollingText } from "@/components/ui/RollingText";
import { TierWordChip } from "@/components/ui/TierWordChip";
import styles from "./TrackRater.module.css";

import type { CSSProperties } from "react";
import type { DisplayTrack, TrackPick } from "@shared/types";

const RATING_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STEP_RIPPLE_IN_MILLISECONDS = 18;

interface TrackRaterProps {
  tracks: DisplayTrack[];
  /** A rating of 0 clears the track's rating */
  onRate: (index: number, rating: number) => void;
  /** null clears the track's pick */
  onPick: (index: number, pick: TrackPick | null) => void;
}

/**
 * Every track in album order, with ten rating steps and Best and Worst toggles.
 * Pressing a track's current step or pick again clears it. An album can have several best and worst tracks.
 */
export function TrackRater({ tracks, onRate, onPick }: TrackRaterProps) {
  return (
    <ol className={styles.list} aria-label="Rate each track">
      {tracks.map((track, index) => {
        const rating = track.rating ?? 0;
        // Track ratings are out of 10, and the tiers are out of 100
        const tier = rating > 0 ? scoreTier(rating * 10) : "Unrated";
        const { title, featuring } = splitFeatures(track.name, track.features);
        const style = { "--tier-fill": tierFillVar(tier) } as CSSProperties;

        return (
          <li key={track.spotifyID} className={styles.row} style={style}>
            <span className={styles.position}>{index + 1}</span>
            <span className={styles.name}>
              {title}
              {featuring.length > 0 && <span className={styles.soft}> feat. {featuring.join(", ")}</span>}
              <span className={styles.duration}>{formatDuration(track.duration, "short")}</span>
            </span>
            <TierWordChip tier={tier}>
              <RollingText text={tier} value={rating} />
            </TierWordChip>

            <div className={styles.controls}>
              <RatingSteps trackName={track.name} rating={rating} onRate={step => onRate(index, step)} />
              <button type="button" className={styles.pick} data-pick="best" aria-pressed={track.pick === "best"} onClick={() => onPick(index, track.pick === "best" ? null : "best")}>
                Best
              </button>
              <button type="button" className={styles.pick} data-pick="worst" aria-pressed={track.pick === "worst"} onClick={() => onPick(index, track.pick === "worst" ? null : "worst")}>
                Worst
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface RatingStepsProps {
  trackName: string;
  rating: number;
  /** A rating of 0 clears the track's rating */
  onRate: (rating: number) => void;
}

/** The ten rating steps for one track. When the rating changes, the steps fill or empty one after another, starting from the old rating. */
function RatingSteps({ trackName, rating, onRate }: RatingStepsProps) {
  const [ratings, setRatings] = useState({ current: rating, previous: rating });
  if (rating !== ratings.current) {
    setRatings({ current: rating, previous: ratings.current });
  }

  const { previous } = ratings;
  const lowestChanged = Math.min(previous, rating) + 1;
  const highestChanged = Math.max(previous, rating);

  return (
    <div className={styles.steps} role="group" aria-label={`Rate ${trackName}`}>
      {RATING_STEPS.map(step => {
        const changed = step >= lowestChanged && step <= highestChanged;
        const distanceFromPrevious = rating > previous ? step - lowestChanged : highestChanged - step;
        const style = { "--step-delay": changed ? `${distanceFromPrevious * STEP_RIPPLE_IN_MILLISECONDS}ms` : "0ms" } as CSSProperties;

        return (
          <button
            key={step}
            type="button"
            className={step <= rating ? `${styles.step} ${styles.filled}` : styles.step}
            style={style}
            aria-pressed={step === rating}
            aria-label={`${step} out of 10`}
            onClick={() => onRate(step === rating ? 0 : step)}
          >
            {step}
          </button>
        );
      })}
    </div>
  );
}
