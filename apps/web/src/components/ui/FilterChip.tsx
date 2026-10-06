import styles from "./FilterChip.module.css";

interface FilterChipProps {
  label: string;
  /** A soft count after the label */
  count?: number;
  pressed: boolean;
  onClick: () => void;
}

/** A round toggle button for a filter. It fills with the ink colour when it's on. */
export function FilterChip({ label, count, pressed, onClick }: FilterChipProps) {
  return (
    <button type="button" className={styles.chip} aria-pressed={pressed} onClick={onClick}>
      {label}
      {count !== undefined && <small className={styles.count}>{count}</small>}
    </button>
  );
}
