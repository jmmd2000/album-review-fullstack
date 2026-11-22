import switchStyles from "@/components/stats/ViewSwitch.module.css";

import type { RankBy } from "@/lib/listening";

/** Ranks the listening lists by plays or by minutes listened. Looks the same as the Stats view switch. */
export function RankBySwitch({ by, onChange }: { by: RankBy; onChange: (by: RankBy) => void }) {
  return (
    <div className={switchStyles.switch} role="group" aria-label="Rank by">
      <button type="button" className={switchStyles.option} aria-pressed={by === "plays"} onClick={() => onChange("plays")}>
        Plays
      </button>
      <button type="button" className={switchStyles.option} aria-pressed={by === "minutes"} onClick={() => onChange("minutes")}>
        Minutes
      </button>
    </div>
  );
}
