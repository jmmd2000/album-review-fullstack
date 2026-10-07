import { scoreTier } from "@shared/helpers/ratingTiers";
import { tierFillVar } from "@/lib/tierColours";
import styles from "./ScoreChip.module.css";

interface ScoreChipProps {
  /** The score out of 100, or null when there isn't one yet */
  score: number | null;
}

/** A score on a solid chip of its tier colour. No score shows a dash on the Unrated grey. */
export function ScoreChip({ score }: ScoreChipProps) {
  const tier = scoreTier(score);

  return (
    <span className={styles.chip} style={{ backgroundColor: tierFillVar(tier) }} title={tier}>
      {score === null ? "-" : Math.ceil(score)}
    </span>
  );
}
