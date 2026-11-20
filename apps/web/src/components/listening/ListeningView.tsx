import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { describePeriod, KIND_LABELS, PERIOD_LABELS, type ListeningKind, type ListeningPeriod } from "@/lib/listening";
import { FilterChip } from "@/components/ui/FilterChip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TopEntryRow } from "@/components/listening/TopEntryRow";
import styles from "./ListeningView.module.css";

const FIRST_ROWS = 10;

export interface ListeningSelection {
  kind: ListeningKind;
  period: ListeningPeriod;
  /** A custom period's first day, as YYYY-MM-DD */
  from?: string;
  /** A custom period's last day, as YYYY-MM-DD */
  to?: string;
}

interface ListeningViewProps {
  selection: ListeningSelection;
  onChange: (selection: ListeningSelection) => void;
}

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Dublin" });

/** The admin's most played artists, tracks, albums or genres for a period, from their Spotify plays. */
export function ListeningView({ selection, onChange }: ListeningViewProps) {
  const { kind, period, from, to } = selection;
  const [showAll, setShowAll] = useState(false);
  const customReady = period !== "custom" || (from !== undefined && to !== undefined && from <= to);

  const top = useQuery({
    queryKey: queryKeys.listening.top(kind, period, from, to),
    queryFn: () => handle(client.api.listening.top.$get({ query: { kind, period, ...(period === "custom" ? { from, to } : {}) } })),
    enabled: customReady,
  });
  const status = useQuery({
    queryKey: queryKeys.settings.listening,
    queryFn: () => handle(client.api.listening.$get()),
  });

  function choose(next: Partial<ListeningSelection>) {
    setShowAll(false);
    onChange({ ...selection, ...next });
  }

  function chooseCustom() {
    const lastDay = to ?? today();
    choose({ period: "custom", from: from ?? lastDay, to: lastDay });
  }

  const entries = top.data?.entries ?? [];
  const shown = showAll ? entries : entries.slice(0, FIRST_ROWS);

  return (
    <div className={styles.view}>
      {status.data && !status.data.connected && <p className={styles.notice}>Spotify isn't connected, so new plays aren't being saved.</p>}
      <p className={styles.tally}>
        {top.data ? (
          <>
            <b>{top.data.totals.plays.toLocaleString("en-GB")}</b> plays by <b>{top.data.totals.artists.toLocaleString("en-GB")}</b> artists {describePeriod(period, from, to)}.
          </>
        ) : (
          " "
        )}
      </p>

      <div className={styles.controls}>
        <div className={styles.kinds} role="group" aria-label="Show">
          {(Object.keys(KIND_LABELS) as ListeningKind[]).map(option => (
            <button key={option} type="button" className={styles.kind} aria-pressed={option === kind} onClick={() => choose({ kind: option })}>
              {KIND_LABELS[option]}
            </button>
          ))}
        </div>
        <div className={styles.periods} role="group" aria-label="Period">
          {(Object.keys(PERIOD_LABELS) as ListeningPeriod[]).map(option => (
            <FilterChip key={option} label={PERIOD_LABELS[option]} pressed={option === period} onClick={() => (option === "custom" ? chooseCustom() : choose({ period: option }))} />
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div className={styles.dates}>
          <label>
            From
            <Input type="date" value={from ?? ""} max={to} onChange={event => choose({ from: event.target.value || undefined })} />
          </label>
          <label>
            To
            <Input type="date" value={to ?? ""} min={from} max={today()} onChange={event => choose({ to: event.target.value || undefined })} />
          </label>
        </div>
      )}

      {top.isPending && customReady && <p className={styles.state}>Loading…</p>}
      {top.isError && (
        <p className={styles.state} role="alert">
          The listening stats couldn't load. {top.error.message}
        </p>
      )}
      {top.isSuccess && entries.length === 0 && <p className={styles.state}>Nothing played in this period.</p>}
      {entries.length > 0 && (
        <>
          <ol className={styles.entries}>
            {shown.map(entry => (
              <TopEntryRow key={entry.id} kind={kind} entry={entry} />
            ))}
          </ol>
          {!showAll && entries.length > FIRST_ROWS && <Button onClick={() => setShowAll(true)}>Show {entries.length - FIRST_ROWS} more</Button>}
        </>
      )}
    </div>
  );
}
