import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { describePeriod, KIND_LABELS, PERIOD_LABELS, type ListeningKind, type ListeningPeriod, type RankBy } from "@/lib/listening";
import { FilterChip } from "@/components/ui/FilterChip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TopEntryRow } from "@/components/listening/TopEntryRow";
import { SelectedEntry } from "@/components/listening/SelectedEntry";
import { OverTime } from "@/components/listening/OverTime";
import { RankBySwitch } from "@/components/listening/RankBySwitch";
import dialog from "@/styles/dialog.module.css";
import styles from "./ListeningView.module.css";

const FIRST_ROWS = 20;
// Below this width the selected entry opens over the list instead of above it
const NARROW_QUERY = "(width < 900px)";

export interface ListeningSelection {
  kind: ListeningKind;
  period: ListeningPeriod;
  by: RankBy;
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

/**
 * The admin's most played artists, tracks, albums or genres for a period, from their Spotify plays, ranked by plays or minutes.
 * While a new list loads, the last one stays on screen, so the page doesn't jump.
 */
export function ListeningView({ selection, onChange }: ListeningViewProps) {
  const { kind, period, by, from, to } = selection;
  const [showAll, setShowAll] = useState(false);
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chartsFollow, setChartsFollow] = useState(true);
  const customReady = period !== "custom" || (from !== undefined && to !== undefined && from <= to);
  const show = showAll ? "all" : "top";

  const top = useQuery({
    queryKey: queryKeys.listening.top(kind, period, by, show, from, to),
    queryFn: () => handle(client.api.listening.top.$get({ query: { kind, period, by, show, ...(period === "custom" ? { from, to } : {}) } })),
    enabled: customReady,
    placeholderData: keepPreviousData,
  });
  const status = useQuery({
    queryKey: queryKeys.settings.listening,
    queryFn: () => handle(client.api.listening.$get()),
  });

  function choose(next: Partial<ListeningSelection>) {
    setShowAll(false);
    setSelectedID(null);
    onChange({ ...selection, ...next });
  }

  function chooseCustom() {
    const lastDay = to ?? today();
    choose({ period: "custom", from: from ?? lastDay, to: lastDay });
  }

  // The list on screen can be the last one while the next loads, so it renders as the kind and measure it was loaded for
  const shownKind = top.data?.kind ?? kind;
  const shownBy = top.data?.by ?? by;
  const entries = top.data?.entries ?? [];
  const shown = showAll ? entries : entries.slice(0, FIRST_ROWS);
  const selected = entries.find(entry => entry.id === selectedID) ?? entries[0];

  function select(id: string) {
    setSelectedID(id);
    if (window.matchMedia(NARROW_QUERY).matches) setSheetOpen(true);
  }

  const shownSelection = { ...selection, kind: shownKind, by: shownBy };

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
        <div className={styles.controlsEnd}>
          <div className={styles.periods} role="group" aria-label="Period">
            {(Object.keys(PERIOD_LABELS) as ListeningPeriod[]).map(option => (
              <FilterChip key={option} label={PERIOD_LABELS[option]} pressed={option === period} onClick={() => (option === "custom" ? chooseCustom() : choose({ period: option }))} />
            ))}
          </div>
          <RankBySwitch by={by} onChange={next => choose({ by: next })} />
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
      {top.isSuccess && !top.isPlaceholderData && entries.length === 0 && <p className={styles.state}>Nothing played in this period.</p>}
      {selected && (
        <div className={styles.body} data-loading={top.isPlaceholderData}>
          <div className={styles.selected}>
            <SelectedEntry selection={shownSelection} entry={selected} />
          </div>
          <ol className={styles.entries}>
            {shown.map(entry => (
              <TopEntryRow key={entry.id} kind={shownKind} by={shownBy} entry={entry} selected={entry.id === selected.id} onSelect={() => select(entry.id)} />
            ))}
          </ol>
          {!showAll && entries.length > FIRST_ROWS && <Button onClick={() => setShowAll(true)}>Show all</Button>}
          <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
            <Dialog.Portal>
              <Dialog.Backdrop className={dialog.backdrop} />
              <Dialog.Popup className={`${dialog.popup} ${styles.sheet}`}>
                <Dialog.Title className={styles.hidden}>{selected.name}</Dialog.Title>
                <Dialog.Close render={<Button />}>Close</Dialog.Close>
                <SelectedEntry selection={shownSelection} entry={selected} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
      {entries.length > 0 && (
        <OverTime selection={selection} entry={selected ? { kind: shownKind, id: selected.id, name: selected.name } : null} follow={chartsFollow} onFollowChange={setChartsFollow} />
      )}
    </div>
  );
}
