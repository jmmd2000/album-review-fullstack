import { memo, useState } from "react";
import { OptionSwitch } from "@/components/ui/OptionSwitch";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { describeAmount, roundedTop } from "@/lib/listening";
import styles from "./MonthlyListening.module.css";

type ChartView = "plays" | "minutes" | "rank";

interface Month {
  /** YYYY-MM */
  month: string;
  plays: number;
  minutes: number;
  /** The rank among everything of its kind played that month, or null when it wasn't played */
  rank?: number | null;
}

interface MonthlyListeningProps {
  /** The months to chart, or null while they load */
  months: Month[] | null;
  /** Offer the rank each month as well as plays and minutes */
  withRank?: boolean;
}

const AMOUNT_OPTIONS: { value: ChartView; label: string }[] = [
  { value: "plays", label: "Plays" },
  { value: "minutes", label: "Minutes" },
];
const RANK_OPTION: { value: ChartView; label: string } = { value: "rank", label: "Rank" };
// With more months than this, only each January is labelled, with its year
const MONTHLY_LABEL_LIMIT = 24;

const monthName = (month: string) => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/** The month's minutes, or its plays and rank, such as "Mar 2025: 120 plays, #3 that month" */
function describeMonth(month: Month, view: ChartView): string {
  if (view === "minutes") return `${monthName(month.month)}: ${describeAmount(month.minutes, "minutes")}`;
  const plays = `${monthName(month.month)}: ${describeAmount(month.plays, "plays")}`;
  const rank = month.rank ?? null;
  return rank === null ? plays : `${plays}, #${rank} that month`;
}

/**
 * The admin's plays or minutes each month, picked with a switch. With `withRank`, the switch also offers the rank each month.
 * While the months load, an empty chart holds their space.
 */
export function MonthlyListening({ months, withRank = false }: MonthlyListeningProps) {
  const [view, setView] = useState<ChartView>("plays");
  const [pointed, setPointed] = useState<number | null>(null);

  let readout = view === "rank" ? "Not ranked in any month" : "No plays yet";
  const pointedMonth = pointed === null || months === null ? undefined : months[pointed];
  if (months === null) {
    readout = "";
  } else if (pointedMonth) {
    readout = describeMonth(pointedMonth, view);
  } else if (view !== "rank") {
    const most = Math.max(0, ...months.map(month => month[view]));
    const busiest = months.find(month => month[view] === most && most > 0);
    if (busiest) readout = `Busiest: ${monthName(busiest.month)}, ${describeAmount(busiest[view], view)}`;
  } else {
    const ranks = months.flatMap(month => (month.rank === null || month.rank === undefined ? [] : [month.rank]));
    const best = months.find(month => month.rank === Math.min(...ranks));
    if (best) readout = `Best rank: ${monthName(best.month)}, #${best.rank}`;
  }

  return (
    <section className={styles.section}>
      <SectionHeader title="Listening" link={<OptionSwitch label="Chart shows" options={withRank ? [...AMOUNT_OPTIONS, RANK_OPTION] : AMOUNT_OPTIONS} value={view} onChange={setView} />} />
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
  const amountOf = (month: Month) => (view === "minutes" ? month.minutes : month.plays);
  const top = roundedTop(Math.max(0, ...months.map(amountOf)));
  const half = top / 2;
  const worstRank = Math.max(1, ...months.map(month => month.rank ?? 0));
  const labelEvery = months.length > MONTHLY_LABEL_LIMIT ? null : 3;

  const barHeight = (month: Month) => {
    if (view !== "rank") return top > 0 ? amountOf(month) / top : 0;
    if (month.rank === null || month.rank === undefined) return 0;
    return (worstRank - month.rank + 1) / worstRank;
  };

  const label = (month: Month, index: number) => {
    // A label runs to the right of its month, so the last two months have no room for one
    if (index >= months.length - 2) return "";
    if (labelEvery === null) return month.month.endsWith("-01") ? month.month.slice(0, 4) : "";
    return index % labelEvery === 0 ? monthName(month.month) : "";
  };

  return (
    <div className={styles.chart}>
      <div className={styles.axis} aria-hidden="true">
        <span>{view === "rank" ? "#1" : top.toLocaleString("en-GB")}</span>
        <span>{view !== "rank" && Number.isInteger(half) ? half.toLocaleString("en-GB") : ""}</span>
        <span>{view === "rank" ? "" : "0"}</span>
      </div>
      <ol className={styles.months} data-dense={months.length > MONTHLY_LABEL_LIMIT * 2 || undefined} onMouseLeave={() => onPoint(null)}>
        {months.map((month, index) => {
          return (
            <li key={month.month} tabIndex={0} aria-label={describeMonth(month, view)} onMouseEnter={() => onPoint(index)} onFocus={() => onPoint(index)} onBlur={() => onPoint(null)}>
              <span className={styles.barArea}>
                <span className={styles.bar} style={{ height: `${barHeight(month) * 100}%` }} />
              </span>
              <span className={styles.label} data-minor={(labelEvery !== null && !month.month.endsWith("-01")) || undefined}>
                {label(month, index)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
});
