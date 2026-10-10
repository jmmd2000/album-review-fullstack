import { useEffect, useRef, useState } from "react";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { tierFillVar } from "@/lib/tierColours";
import styles from "./ScoreChip.module.css";

interface ScoreChipProps {
  /** The score out of 100, or null when there isn't one yet */
  score: number | null;
}

/**
 * A score on a solid chip of its tier colour. No score shows a dash on the Unrated grey.
 * A Perfect chip glints three times, 8 seconds apart, once it first comes into view, and again whenever its link is hovered or focused.
 */
export function ScoreChip({ score }: ScoreChipProps) {
  const tier = scoreTier(score);
  const { chipRef, seen } = useSeenOnce(tier === "Perfect");

  return (
    <span ref={chipRef} className={styles.chip} style={{ backgroundColor: tierFillVar(tier) }} title={tier} data-tier={tier} data-glint={seen || undefined} data-on-tier="">
      {score === null ? "-" : Math.ceil(score)}
    </span>
  );
}

/** Reports true once most of the chip has been on screen. It only watches when `enabled` is true. */
function useSeenOnce(enabled: boolean) {
  const chipRef = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const chip = chipRef.current;
    if (!enabled || !chip) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.6 }
    );
    observer.observe(chip);
    return () => observer.disconnect();
  }, [enabled]);

  return { chipRef, seen };
}
