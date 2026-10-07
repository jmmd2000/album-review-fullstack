import { scoreTier } from "@shared/helpers/ratingTiers";
import { formatDuration } from "@shared/helpers/formatDuration";
import { tierColourVar, tierFillVar } from "@/lib/tierColours";
import { splitFeatures } from "@/lib/trackFeatures";
import styles from "./TrackRater.module.css";

import type { CSSProperties } from "react";
import type { DisplayTrack, TrackPick } from "@shared/types";

const RATING_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
        const style = { "--tier-colour": tierColourVar(tier), "--tier-fill": tierFillVar(tier) } as CSSProperties;

        return (
          <li key={track.spotifyID} className={styles.row} style={style}>
            <span className={styles.position}>{index + 1}</span>
            <span className={styles.name}>
              {title}
              {featuring.length > 0 && <span className={styles.soft}> feat. {featuring.join(", ")}</span>}
              <span className={styles.duration}>{formatDuration(track.duration, "short")}</span>
            </span>
            <span className={styles.rating}>{rating > 0 ? tier : ""}</span>

            <div className={styles.controls}>
              <div className={styles.steps} role="group" aria-label={`Rate ${track.name}`}>
                {RATING_STEPS.map(step => (
                  <button
                    key={step}
                    type="button"
                    className={step <= rating ? `${styles.step} ${styles.filled}` : styles.step}
                    aria-pressed={step === rating}
                    aria-label={`${step} out of 10`}
                    onClick={() => onRate(index, step === rating ? 0 : step)}
                  >
                    {step}
                  </button>
                ))}
              </div>
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
