import { useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./RollingText.module.css";

interface RollingTextProps {
  text: string;
  /** A higher value than at the last change rolls the new text up, and a lower one rolls it down */
  value: number;
}

interface LeavingText {
  text: string;
  direction: "up" | "down";
}

/**
 * Text that rolls to its new wording when it changes
 * Under reduced motion the text changes in place.
 */
export function RollingText({ text, value }: RollingTextProps) {
  const [shown, setShown] = useState({ text, value, changeCount: 0 });
  const [leaving, setLeaving] = useState<LeavingText | null>(null);

  if (text !== shown.text) {
    const direction = value >= shown.value ? "up" : "down";
    setLeaving(prefersReducedMotion() ? null : { text: shown.text, direction });
    setShown({ text, value, changeCount: shown.changeCount + 1 });
  }

  return (
    <span className={styles.roll} data-direction={leaving?.direction}>
      {leaving && (
        <span key={`leaving-${shown.changeCount}`} className={styles.leaving} aria-hidden="true" onAnimationEnd={() => setLeaving(null)}>
          {leaving.text}
        </span>
      )}
      <span key={shown.changeCount} className={leaving ? styles.entering : undefined}>
        {shown.text}
      </span>
    </span>
  );
}
