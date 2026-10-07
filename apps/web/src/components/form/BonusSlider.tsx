import { useId } from "react";
import { MAX_ALBUM_BONUS } from "@shared/constants";
import { formatBonus } from "@/lib/reviewForm";
import styles from "./BonusSlider.module.css";

interface BonusSliderProps {
  value: number;
  onChange: (bonus: number) => void;
}

/** The slider for the review's bonus, the points added or taken away for how the album works as a whole. */
export function BonusSlider({ value, onChange }: BonusSliderProps) {
  const id = useId();
  const hintID = `${id}-hint`;

  return (
    <div className={styles.slider}>
      <div className={styles.top}>
        <label className={styles.label} htmlFor={id}>
          Bonus
        </label>
        <output className={styles.value} htmlFor={id}>
          {formatBonus(value)}
        </output>
      </div>
      <p id={hintID} className={styles.hint}>
        For how the album works as a whole: flow, sequencing and cohesion.
      </p>
      <div className={styles.track}>
        <span aria-hidden="true">-{MAX_ALBUM_BONUS}</span>
        <input
          id={id}
          className={styles.input}
          type="range"
          min={-MAX_ALBUM_BONUS}
          max={MAX_ALBUM_BONUS}
          step={0.1}
          value={value}
          aria-describedby={hintID}
          onChange={event => onChange(Number(event.currentTarget.value))}
        />
        <span aria-hidden="true">+{MAX_ALBUM_BONUS}</span>
      </div>
    </div>
  );
}
