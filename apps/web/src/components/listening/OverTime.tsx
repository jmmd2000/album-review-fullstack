import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { bucketLabel, roundedTop } from "@/lib/listening";
import styles from "./OverTime.module.css";

import type { ListeningSelection } from "@/components/listening/ListeningView";

type Chart = "plays" | "clock";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_LABELS = 6;

/** Plays in each day, week or month of the period, or the listening clock: plays in each hour of each weekday. */
export function OverTime({ selection }: { selection: ListeningSelection }) {
  const { period, from, to } = selection;
  const [chart, setChart] = useState<Chart>("plays");
  const overTime = useQuery({
    queryKey: queryKeys.listening.overTime(period, from, to),
    queryFn: () => handle(client.api.listening["over-time"].$get({ query: { period, ...(period === "custom" ? { from, to } : {}) } })),
  });

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Over time</h2>
        <div className={styles.tabs} role="group" aria-label="Chart">
          <button type="button" aria-pressed={chart === "plays"} onClick={() => setChart("plays")}>
            Plays
          </button>
          <button type="button" aria-pressed={chart === "clock"} onClick={() => setChart("clock")}>
            When you listen
          </button>
        </div>
      </div>
      {overTime.data && chart === "plays" && <PlaysChart unit={overTime.data.unit} timeline={overTime.data.timeline} />}
      {overTime.data && chart === "clock" && <ListeningClock clock={overTime.data.clock} />}
    </section>
  );
}

function PlaysChart({ unit, timeline }: { unit: "day" | "week" | "month"; timeline: { start: string; plays: number }[] }) {
  const top = roundedTop(Math.max(0, ...timeline.map(bucket => bucket.plays)));
  const labelEvery = Math.ceil(timeline.length / MAX_LABELS);

  return (
    <div className={styles.chart}>
      <div className={styles.axis} aria-hidden="true">
        <span>{top.toLocaleString("en-GB")}</span>
        <span>{(top / 2).toLocaleString("en-GB")}</span>
        <span>0</span>
      </div>
      <ol className={styles.bars}>
        {timeline.map((bucket, index) => (
          <li key={bucket.start} title={`${bucketLabel(bucket.start, unit, true)}: ${bucket.plays} plays`}>
            <span className={styles.bar} style={{ height: `${top > 0 ? (bucket.plays / top) * 100 : 0}%` }} />
            <span className={styles.label}>{index % labelEvery === 0 ? bucketLabel(bucket.start, unit, false) : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ListeningClock({ clock }: { clock: number[][] }) {
  const most = Math.max(1, ...clock.flat());

  return (
    <div className={styles.clock}>
      {clock.map((hours, weekday) => (
        <div key={WEEKDAYS[weekday]} className={styles.clockRow}>
          <span className={styles.weekday}>{WEEKDAYS[weekday]}</span>
          {hours.map((plays, hour) => (
            <span key={hour} className={styles.cell} style={{ opacity: plays === 0 ? 0.06 : 0.15 + (plays / most) * 0.85 }} title={`${WEEKDAYS[weekday]} ${hour}:00: ${plays} plays`} />
          ))}
        </div>
      ))}
      <div className={styles.clockRow} aria-hidden="true">
        <span className={styles.weekday} />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={hour} className={styles.hour}>
            {hour % 6 === 0 ? `${hour}:00` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
