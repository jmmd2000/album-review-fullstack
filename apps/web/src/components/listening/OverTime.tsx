import { memo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { bucketLabel, roundedTop, type ListeningKind } from "@/lib/listening";
import switchStyles from "@/components/stats/ViewSwitch.module.css";
import styles from "./OverTime.module.css";

import type { ListeningSelection } from "@/components/listening/ListeningView";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_NAMES = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
// A week bucket is named by its first day
const BUCKET_PREFIXES = { day: "", week: "week of ", month: "" } as const;
const MAX_LABELS = 6;

const countPlays = (plays: number) => (plays === 1 ? "1 play" : `${plays.toLocaleString("en-GB")} plays`);
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
 * Plays in each day, week or month of the period, then the listening clock: plays in each hour of each weekday.
 * They show the selected entry's plays, or all plays when `follow` is off.
 */
export function OverTime({ selection, entry, follow, onFollowChange }: OverTimeProps) {
  const { period, from, to } = selection;
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
        <PlaysChart unit={overTime.data.unit} timeline={overTime.data.timeline} />
      </section>
      <section className={styles.section}>
        <h2 className={styles.title}>{focus ? `When I listen to ${focus.name}` : "When I listen"}</h2>
        <ListeningClock clock={overTime.data.clock} />
      </section>
    </div>
  );
}

type Bucket = { start: string; plays: number };
type Unit = "day" | "week" | "month";

/** A bucket's name, such as "week of 2 Nov 2026" or "Mar 2026" */
function bucketName(bucket: Bucket, unit: Unit): string {
  return `${BUCKET_PREFIXES[unit]}${bucketLabel(bucket.start, unit, true)}`;
}

/** A bucket's name and plays, such as "Week of 2 Nov 2026: 605 plays" */
function describeBucket(bucket: Bucket, unit: Unit): string {
  const name = bucketName(bucket, unit);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${countPlays(bucket.plays)}`;
}

function describeHour(clock: number[][], weekday: number, hour: number): string {
  return `${WEEKDAY_NAMES[weekday]} at ${hourName(hour)}: ${countPlays(clock[weekday][hour])}`;
}

/** Bars of plays over the period. Pointing at a bar shows its plays, and otherwise the busiest one shows. */
function PlaysChart({ unit, timeline }: { unit: Unit; timeline: Bucket[] }) {
  const [pointed, setPointed] = useState<number | null>(null);
  const most = Math.max(0, ...timeline.map(bucket => bucket.plays));
  const busiest = timeline.find(bucket => bucket.plays === most);

  let readout = "No plays in this period";
  if (pointed !== null && timeline[pointed]) readout = describeBucket(timeline[pointed], unit);
  else if (busiest && most > 0) readout = `Busiest: ${bucketName(busiest, unit)}, ${countPlays(most)}`;

  return (
    <div className={styles.chartArea}>
      <p className={styles.readout}>{readout}</p>
      <PlaysBars unit={unit} timeline={timeline} onPoint={setPointed} />
    </div>
  );
}

/**
 * The bars themselves. They don't re-render when the pointer moves between them, only the readout does,
 * and the fade on the other bars is plain CSS.
 */
const PlaysBars = memo(function PlaysBars({ unit, timeline, onPoint }: { unit: Unit; timeline: Bucket[]; onPoint: (index: number | null) => void }) {
  const top = roundedTop(Math.max(0, ...timeline.map(bucket => bucket.plays)));
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
          <li key={bucket.start} tabIndex={0} aria-label={describeBucket(bucket, unit)} onMouseEnter={() => onPoint(index)} onFocus={() => onPoint(index)} onBlur={() => onPoint(null)}>
            <span className={styles.bar} style={{ height: `${top > 0 ? (bucket.plays / top) * 100 : 0}%` }} />
            <span className={styles.label}>{index % labelEvery === 0 ? bucketLabel(bucket.start, unit, false) : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
});

/** Plays in each hour of each weekday, darker for more. Pointing at an hour shows its plays, and otherwise the busiest hour shows. */
function ListeningClock({ clock }: { clock: number[][] }) {
  const [pointed, setPointed] = useState<{ weekday: number; hour: number } | null>(null);
  const most = Math.max(0, ...clock.flat());
  const busiestWeekday = clock.findIndex(hours => hours.includes(most));

  let readout = "No plays in this period";
  if (pointed !== null) readout = describeHour(clock, pointed.weekday, pointed.hour);
  else if (most > 0) readout = `Busiest hour: ${describeHour(clock, busiestWeekday, clock[busiestWeekday].indexOf(most))}`;

  return (
    <div className={styles.chartArea}>
      <p className={styles.readout}>{readout}</p>
      <ClockCells clock={clock} onPoint={setPointed} />
    </div>
  );
}

/** The clock's cells. Like the bars, they don't re-render when the pointer moves, and the outline is plain CSS. */
const ClockCells = memo(function ClockCells({ clock, onPoint }: { clock: number[][]; onPoint: (pointed: { weekday: number; hour: number } | null) => void }) {
  const most = Math.max(1, ...clock.flat());

  return (
    <div className={styles.clock} onMouseLeave={() => onPoint(null)}>
      {clock.map((hours, weekday) => (
        <div key={WEEKDAYS[weekday]} className={styles.clockRow}>
          <span className={styles.weekday}>{WEEKDAYS[weekday]}</span>
          {hours.map((plays, hour) => (
            <span
              key={hour}
              className={styles.cell}
              tabIndex={0}
              aria-label={describeHour(clock, weekday, hour)}
              style={{ opacity: plays === 0 ? 0.06 : 0.15 + (plays / most) * 0.85 }}
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
