import { memo, useState } from "react";
import { OptionSwitch } from "@/components/ui/OptionSwitch";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { describePlays, roundedTop } from "@/lib/listening";
import styles from "./MonthlyListening.module.css";

type ChartView = "plays" | "rank";

interface Month {
  /** YYYY-MM */
  month: string;
  plays: number;
  /** The rank among everything of its kind played that month, or null when it wasn't played */
  rank?: number | null;
}

interface MonthlyListeningProps {
  /** The months to chart, or null while they load */
  months: Month[] | null;
  /** Show a switch between plays and rank */
  withRank?: boolean;
}

const VIEW_OPTIONS: { value: ChartView; label: string }[] = [
  { value: "plays", label: "Plays" },
  { value: "rank", label: "Rank" },
];
// With more months than this, only each January is labelled, with its year
const MONTHLY_LABEL_LIMIT = 24;

const monthName = (month: string) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/** The month's plays and rank, such as "Mar 2025: 120 plays, #3 that month" */
function describeMonth(month: Month): string {
  const plays = `${monthName(month.month)}: ${describePlays(month.plays)}`;
  const rank = month.rank ?? null;
  return rank === null ? plays : `${plays}, #${rank} that month`;
}

/**
 * The admin's plays each month. With `withRank`, a switch changes the chart to the rank each month.
 * While the months load, an empty chart holds their space.
 */
export function MonthlyListening({ months, withRank = false }: MonthlyListeningProps) {
  const [view, setView] = useState<ChartView>("plays");
  const [pointed, setPointed] = useState<number | null>(null);

  let readout = view === "plays" ? "No plays yet" : "Not ranked in any month";
  const pointedMonth = pointed === null || months === null ? undefined : months[pointed];
  if (months === null) {
    readout = "";
  } else if (pointedMonth) {
    readout = describeMonth(pointedMonth);
  } else if (view === "plays") {
    const mostPlays = Math.max(0, ...months.map(month => month.plays));
    const busiest = months.find(month => month.plays === mostPlays && mostPlays > 0);
    if (busiest) readout = `Busiest: ${monthName(busiest.month)}, ${describePlays(busiest.plays)}`;
  } else {
    const ranks = months.flatMap(month => (month.rank === null || month.rank === undefined ? [] : [month.rank]));
    const best = months.find(month => month.rank === Math.min(...ranks));
    if (best) readout = `Best rank: ${monthName(best.month)}, #${best.rank}`;
  }

  return (
    <section className={styles.section}>
      <SectionHeader title="Listening" link={withRank && <OptionSwitch label="Chart shows" options={VIEW_OPTIONS} value={view} onChange={setView} />} />
      <div className={styles.shell}>
        <p className={styles.readout}>{readout}</p>
        {months === null ? <div className={styles.loading} /> : <MonthBars months={months} view={view} onPoint={setPointed} />}
      </div>
    </section>
  );
}

interface MonthBarsProps {
  months: Month[];
  view: ChartView;
  onPoint: (index: number | null) => void;
}

/**
 * One bar per month. In the rank view a taller bar is a better rank, and a month without plays has no bar.
 * The rank axis marks only #1, because the worst rank's bar still has some height.
 * The bars don't re-render as the pointer moves between them, and the fade on the others is plain CSS.
 */
const MonthBars = memo(function MonthBars({ months, view, onPoint }: MonthBarsProps) {
  const top = roundedTop(Math.max(0, ...months.map(month => month.plays)));
  const half = top / 2;
  const worstRank = Math.max(1, ...months.map(month => month.rank ?? 0));
  const labelEvery = months.length > MONTHLY_LABEL_LIMIT ? null : 3;

  const barHeight = (month: Month) => {
    if (view === "plays") return top > 0 ? month.plays / top : 0;
    if (month.rank === null || month.rank === undefined) return 0;
    return (worstRank - month.rank + 1) / worstRank;
  };

  const label = (month: Month, index: number) => {
    if (labelEvery === null) return month.month.endsWith("-01") ? month.month.slice(0, 4) : "";
    return index % labelEvery === 0 ? monthName(month.month) : "";
  };

  return (
    <div className={styles.chart}>
      <div className={styles.axis} aria-hidden="true">
        <span>{view === "plays" ? top.toLocaleString("en-GB") : "#1"}</span>
        <span>{view === "plays" && Number.isInteger(half) ? half.toLocaleString("en-GB") : ""}</span>
        <span>{view === "plays" ? "0" : ""}</span>
      </div>
      <ol className={styles.months} data-dense={months.length > MONTHLY_LABEL_LIMIT * 2 || undefined} onMouseLeave={() => onPoint(null)}>
        {months.map((month, index) => {
          return (
            <li key={month.month} tabIndex={0} aria-label={describeMonth(month)} onMouseEnter={() => onPoint(index)} onFocus={() => onPoint(index)} onBlur={() => onPoint(null)}>
              <span className={styles.barArea}>
                <span className={styles.bar} style={{ height: `${barHeight(month) * 100}%` }} />
              </span>
              <span className={styles.label}>{label(month, index)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
});
