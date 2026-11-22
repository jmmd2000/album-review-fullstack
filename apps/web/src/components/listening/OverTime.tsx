import { memo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { bucketLabel, describeAmount, roundedTop, type ListeningKind, type RankBy } from "@/lib/listening";
import switchStyles from "@/components/stats/ViewSwitch.module.css";
import styles from "./OverTime.module.css";

import type { ListeningSelection } from "@/components/listening/ListeningView";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_NAMES = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
// A week bucket is named by its first day
const BUCKET_PREFIXES = { day: "", week: "week of ", month: "" } as const;
const MAX_LABELS = 6;

const hourName = (hour: number) => (hour === 0 ? "midnight" : hour === 12 ? "noon" : hour < 12 ? `${hour}am` : `${hour - 12}pm`);

const ENTRY_LABELS: Record<ListeningKind, string> = { artists: "This artist", tracks: "This track", albums: "This album", genres: "This genre" };

interface OverTimeProps {
  selection: ListeningSelection;
  /** The selected entry, which the charts follow when `follow` is true */
  entry: { kind: ListeningKind; id: string; name: string } | null;
  follow: boolean;
  onFollowChange: (follow: boolean) => void;
}

/**
 * Plays or minutes in each day, week or month of the period, then the listening clock: plays or minutes in each hour of each weekday.
 * They follow the plays and minutes switch, and show the selected entry's listening, or all listening when `follow` is off.
 */
export function OverTime({ selection, entry, follow, onFollowChange }: OverTimeProps) {
  const { period, by, from, to } = selection;
  const focus = follow ? entry : null;
  const overTime = useQuery({
    queryKey: queryKeys.listening.overTime(period, from, to, focus?.kind, focus?.id),
    queryFn: () => handle(client.api.listening["over-time"].$get({ query: { period, ...(period === "custom" ? { from, to } : {}), ...(focus ? { kind: focus.kind, id: focus.id } : {}) } })),
    placeholderData: keepPreviousData,
  });

  if (!overTime.data) return null;
  return (
    <div className={styles.sections} data-loading={overTime.isPlaceholderData}>
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>{focus ? `${focus.name} over time` : "Over time"}</h2>
          {entry && (
            <div className={switchStyles.switch} role="group" aria-label="Charts show">
              <button type="button" className={switchStyles.option} aria-pressed={follow} onClick={() => onFollowChange(true)}>
                {ENTRY_LABELS[entry.kind]}
              </button>
              <button type="button" className={switchStyles.option} aria-pressed={!follow} onClick={() => onFollowChange(false)}>
                All listening
              </button>
            </div>
          )}
        </div>
        <TimelineChart unit={overTime.data.unit} timeline={overTime.data.timeline.map(bucket => ({ start: bucket.start, amount: bucket[by] }))} by={by} />
      </section>
      <section className={styles.section}>
        <h2 className={styles.title}>{focus ? `When I listen to ${focus.name}` : "When I listen"}</h2>
        <ListeningClock clock={overTime.data.clock[by]} by={by} />
      </section>
    </div>
  );
}

/** A day, week or month, with its plays or minutes */
type Bucket = { start: string; amount: number };
type Unit = "day" | "week" | "month";

/** A bucket's name, such as "week of 2 Nov 2026" or "Mar 2026" */
function bucketName(bucket: Bucket, unit: Unit): string {
  return `${BUCKET_PREFIXES[unit]}${bucketLabel(bucket.start, unit, true)}`;
}

/** A bucket's name and amount, such as "Week of 2 Nov 2026: 605 plays" */
function describeBucket(bucket: Bucket, unit: Unit, by: RankBy): string {
  const name = bucketName(bucket, unit);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${describeAmount(bucket.amount, by)}`;
}

function describeHour(clock: number[][], weekday: number, hour: number, by: RankBy): string {
  return `${WEEKDAY_NAMES[weekday]} at ${hourName(hour)}: ${describeAmount(clock[weekday][hour], by)}`;
}

/** Bars of plays or minutes over the period. Pointing at a bar shows its amount, and otherwise the busiest one shows. */
function TimelineChart({ unit, timeline, by }: { unit: Unit; timeline: Bucket[]; by: RankBy }) {
  const [pointed, setPointed] = useState<number | null>(null);
  const most = Math.max(0, ...timeline.map(bucket => bucket.amount));
  const busiest = timeline.find(bucket => bucket.amount === most);

  let readout = "No plays in this period";
  if (pointed !== null && timeline[pointed]) readout = describeBucket(timeline[pointed], unit, by);
  else if (busiest && most > 0) readout = `Busiest: ${bucketName(busiest, unit)}, ${describeAmount(most, by)}`;

  return (
    <div className={styles.chartArea}>
      <p className={styles.readout}>{readout}</p>
      <TimelineBars unit={unit} timeline={timeline} by={by} onPoint={setPointed} />
    </div>
  );
}

/**
 * The bars themselves. They don't re-render when the pointer moves between them, only the readout does,
 * and the fade on the other bars is plain CSS.
 */
const TimelineBars = memo(function TimelineBars({ unit, timeline, by, onPoint }: { unit: Unit; timeline: Bucket[]; by: RankBy; onPoint: (index: number | null) => void }) {
  const top = roundedTop(Math.max(0, ...timeline.map(bucket => bucket.amount)));
  const labelEvery = Math.ceil(timeline.length / MAX_LABELS);

  return (
    <div className={styles.chart}>
      <div className={styles.axis} aria-hidden="true">
        <span>{top.toLocaleString("en-GB")}</span>
        <span>{(top / 2).toLocaleString("en-GB")}</span>
        <span>0</span>
      </div>
      <ol className={styles.bars} onMouseLeave={() => onPoint(null)}>
        {timeline.map((bucket, index) => (
          <li key={bucket.start} tabIndex={0} aria-label={describeBucket(bucket, unit, by)} onMouseEnter={() => onPoint(index)} onFocus={() => onPoint(index)} onBlur={() => onPoint(null)}>
            <span className={styles.bar} style={{ height: `${top > 0 ? (bucket.amount / top) * 100 : 0}%` }} />
            <span className={styles.label}>{index % labelEvery === 0 ? bucketLabel(bucket.start, unit, false) : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
});

/** Plays or minutes in each hour of each weekday, darker for more. Pointing at an hour shows its amount, and otherwise the busiest hour shows. */
function ListeningClock({ clock, by }: { clock: number[][]; by: RankBy }) {
  const [pointed, setPointed] = useState<{ weekday: number; hour: number } | null>(null);
  const most = Math.max(0, ...clock.flat());
  const busiestWeekday = clock.findIndex(hours => hours.includes(most));

  let readout = "No plays in this period";
  if (pointed !== null) readout = describeHour(clock, pointed.weekday, pointed.hour, by);
  else if (most > 0) readout = `Busiest hour: ${describeHour(clock, busiestWeekday, clock[busiestWeekday].indexOf(most), by)}`;

  return (
    <div className={styles.chartArea}>
      <p className={styles.readout}>{readout}</p>
      <ClockCells clock={clock} by={by} onPoint={setPointed} />
    </div>
  );
}

/** The clock's cells. Like the bars, they don't re-render when the pointer moves, and the outline is plain CSS. */
const ClockCells = memo(function ClockCells({ clock, by, onPoint }: { clock: number[][]; by: RankBy; onPoint: (pointed: { weekday: number; hour: number } | null) => void }) {
  const most = Math.max(1, ...clock.flat());

  return (
    <div className={styles.clock} onMouseLeave={() => onPoint(null)}>
      {clock.map((hours, weekday) => (
        <div key={WEEKDAYS[weekday]} className={styles.clockRow}>
          <span className={styles.weekday}>{WEEKDAYS[weekday]}</span>
          {hours.map((amount, hour) => (
            <span
              key={hour}
              className={styles.cell}
              tabIndex={0}
              aria-label={describeHour(clock, weekday, hour, by)}
              style={{ opacity: amount === 0 ? 0.06 : 0.15 + (amount / most) * 0.85 }}
              onMouseEnter={() => onPoint({ weekday, hour })}
              onFocus={() => onPoint({ weekday, hour })}
              onBlur={() => onPoint(null)}
            />
          ))}
        </div>
      ))}
      <div className={styles.clockRow} aria-hidden="true">
        <span className={styles.weekday} />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className={styles.hour} data-minor={hour % 6 !== 0 || undefined}>
            {hour % 3 === 0 ? hourName(hour) : ""}
          </span>
        ))}
      </div>
    </div>
  );
});
