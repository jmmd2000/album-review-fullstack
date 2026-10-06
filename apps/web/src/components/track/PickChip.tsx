import styles from "./PickChip.module.css";

interface PickChipProps {
  pick: "best" | "worst";
}

/** Marks an album's best or worst track, in the score chip's shape. */
export function PickChip({ pick }: PickChipProps) {
  return (
    <span className={styles.chip} data-pick={pick}>
      {pick === "best" ? "Best" : "Worst"}
    </span>
  );
}
