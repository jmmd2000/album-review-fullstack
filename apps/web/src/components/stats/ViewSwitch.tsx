import styles from "./ViewSwitch.module.css";

export type StatsView = "scores" | "listening";

interface ViewSwitchProps {
  view: StatsView;
  onChange: (view: StatsView) => void;
}

/** Switches the Stats page between review scores and Spotify listening. */
export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
  return (
    <div className={styles.switch} role="group" aria-label="View">
      <button type="button" className={styles.option} aria-pressed={view === "scores"} onClick={() => onChange("scores")}>
        Scores
      </button>
      <button type="button" className={styles.option} aria-pressed={view === "listening"} onClick={() => onChange("listening")}>
        Listening
      </button>
    </div>
  );
}
