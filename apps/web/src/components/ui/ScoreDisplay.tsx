import { scoreTier } from "@shared/helpers/ratingTiers";
import { tierColourVar } from "@/lib/tierColours";
import styles from "./ScoreDisplay.module.css";

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const tier = scoreTier(score);

  return (
    <div className={styles.lockup} style={{ color: tierColourVar(tier) }}>
      <span className={styles.number}>{Math.ceil(score)}</span>
      <span className={styles.word}>{tier}</span>
    </div>
  );
}
