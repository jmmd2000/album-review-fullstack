import { useEffect, useState, useSyncExternalStore } from "react";
import { getRatingStyles, scoreTier } from "@shared/helpers/ratingTiers";
import { useCountUp } from "@/hooks/useCountUp";
import { prefersReducedMotion } from "@/lib/motion";
import { canScoreArrive, markScoreArrived } from "@/lib/scoreArrival";
import { tierColourVar } from "@/lib/tierColours";
import styles from "./ScoreDisplay.module.css";

interface ScoreDisplayProps {
  score: number;
  /**
   * The album whose page this is. The first time that page opens in a visit, the score counts up
   * from the bottom of its tier, the rule draws across and the tier word fades in.
   */
  arriveFor?: string;
}

function subscribeToNothing() {
  return () => {};
}

/**
 * False while the server renders and while the browser hydrates the server's HTML, and true for anything mounted after.
 * The server draws the first page's score in place, so counting up there would flash the real number first.
 */
function useMountedAfterHydration(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}

/** The score lockup: the number in its tier colour, a rule, and the tier word. */
export function ScoreDisplay({ score, arriveFor }: ScoreDisplayProps) {
  const tier = scoreTier(score);
  const finalNumber = Math.ceil(score);
  const mountedAfterHydration = useMountedAfterHydration();
  const [arriving] = useState(() => mountedAfterHydration && arriveFor !== undefined && canScoreArrive(arriveFor) && !prefersReducedMotion());
  const shownNumber = useCountUp(finalNumber, arriving ? getRatingStyles(score).range[0] : finalNumber);

  useEffect(() => {
    if (arriveFor) markScoreArrived(arriveFor);
  }, [arriveFor]);

  return (
    <div className={arriving ? `${styles.lockup} ${styles.arriving}` : styles.lockup} style={{ color: tierColourVar(tier) }}>
      <span className={styles.number}>{shownNumber}</span>
      <span className={styles.rule} aria-hidden="true" />
      <span className={styles.word}>{tier}</span>
    </div>
  );
}
