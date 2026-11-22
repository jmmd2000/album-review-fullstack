import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { bucketLabel, roundedTop } from "@/lib/listening";
import styles from "./OverTime.module.css";

import type { ListeningSelection } from "@/components/listening/ListeningView";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_NAMES = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
// A week bucket is named by its first day
const BUCKET_PREFIXES = { day: "", week: "week of ", month: "" } as const;
const MAX_LABELS = 6;

const countPlays = (plays: number) => (plays === 1 ? "1 play" : `${plays.toLocaleString("en-GB")} plays`);
const hourName = (hour: number) => (hour === 0 ? "midnight" : hour === 12 ? "noon" : hour < 12 ? `${hour}am` : `${hour - 12}pm`);

/** Plays in each day, week or month of the period, then the listening clock: plays in each hour of each weekday. */
export function OverTime({ selection }: { selection: ListeningSelection }) {
  const { period, from, to } = selection;
  const overTime = useQuery({
    queryKey: queryKeys.listening.overTime(period, from, to),
    queryFn: () => handle(client.api.listening["over-time"].$get({ query: { period, ...(period === "custom" ? { from, to } : {}) } })),
  });

  if (!overTime.data) return null;
  return (
    <div className={styles.sections}>
      <section className={styles.section}>
        <h2 className={styles.title}>Over time</h2>
        <PlaysChart unit={overTime.data.unit} timeline={overTime.data.timeline} />
      </section>
      <section className={styles.section}>
        <h2 className={styles.title}>When I listen</h2>
        <ListeningClock clock={overTime.data.clock} />
      </section>
    </div>
  );
}

/** Bars of plays over the period. Pointing at a bar shows its plays, and otherwise the busiest one shows. */
function PlaysChart({ unit, timeline }: { unit: "day" | "week" | "month"; timeline: { start: string; plays: number }[] }) {
  const [pointed, setPointed] = useState<number | null>(null);
  const most = Math.max(0, ...timeline.map(bucket => bucket.plays));
  const top = roundedTop(most);
  const labelEvery = Math.ceil(timeline.length / MAX_LABELS);
  const busiest = timeline.findIndex(bucket => bucket.plays === most);
  const bucketName = (index: number) => `${BUCKET_PREFIXES[unit]}${bucketLabel(timeline[index].start, unit, true)}`;
  const describe = (index: number) => {
    const name = bucketName(index);
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${countPlays(timeline[index].plays)}`;
  };

  let readout = "No plays in this period";
  if (pointed !== null) readout = describe(pointed);
  else if (most > 0) readout = `Busiest: ${bucketName(busiest)}, ${countPlays(most)}`;

  return (
    <div className={styles.chartArea}>
      <p className={styles.readout}>{readout}</p>
      <div className={styles.chart}>
        <div className={styles.axis} aria-hidden="true">
          <span>{top.toLocaleString("en-GB")}</span>
          <span>{(top / 2).toLocaleString("en-GB")}</span>
          <span>0</span>
        </div>
        <ol className={styles.bars} data-pointing={pointed !== null} onMouseLeave={() => setPointed(null)}>
          {timeline.map((bucket, index) => (
            <li
              key={bucket.start}
              tabIndex={0}
              aria-label={describe(index)}
              data-pointed={pointed === index}
              onMouseEnter={() => setPointed(index)}
              onFocus={() => setPointed(index)}
              onBlur={() => setPointed(null)}
            >
              <span className={styles.bar} style={{ height: `${top > 0 ? (bucket.plays / top) * 100 : 0}%` }} />
              <span className={styles.label}>{index % labelEvery === 0 ? bucketLabel(bucket.start, unit, false) : ""}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Plays in each hour of each weekday, darker for more. Pointing at an hour shows its plays, and otherwise the busiest hour shows. */
function ListeningClock({ clock }: { clock: number[][] }) {
  const [pointed, setPointed] = useState<{ weekday: number; hour: number } | null>(null);
  const most = Math.max(0, ...clock.flat());
  const busiestWeekday = clock.findIndex(hours => hours.includes(most));
  const busiest = { weekday: busiestWeekday, hour: clock[busiestWeekday]?.indexOf(most) ?? 0 };
  const describe = ({ weekday, hour }: { weekday: number; hour: number }) => `${WEEKDAY_NAMES[weekday]} at ${hourName(hour)}: ${countPlays(clock[weekday][hour])}`;

  let readout = "No plays in this period";
  if (pointed !== null) readout = describe(pointed);
  else if (most > 0) readout = `Busiest hour: ${describe(busiest)}`;

  return (
    <div className={styles.chartArea}>
      <p className={styles.readout}>{readout}</p>
      <div className={styles.clock} data-pointing={pointed !== null} onMouseLeave={() => setPointed(null)}>
        {clock.map((hours, weekday) => (
          <div key={WEEKDAYS[weekday]} className={styles.clockRow}>
            <span className={styles.weekday}>{WEEKDAYS[weekday]}</span>
            {hours.map((plays, hour) => (
              <span
                key={hour}
                className={styles.cell}
                tabIndex={0}
                aria-label={describe({ weekday, hour })}
                data-pointed={pointed?.weekday === weekday && pointed.hour === hour}
                style={{ opacity: plays === 0 ? 0.06 : 0.15 + (plays / Math.max(1, most)) * 0.85 }}
                onMouseEnter={() => setPointed({ weekday, hour })}
                onFocus={() => setPointed({ weekday, hour })}
                onBlur={() => setPointed(null)}
              />
            ))}
          </div>
        ))}
        <div className={styles.clockRow} aria-hidden="true">
          <span className={styles.weekday} />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className={styles.hour}>
              {hour % 3 === 0 ? hourName(hour) : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
