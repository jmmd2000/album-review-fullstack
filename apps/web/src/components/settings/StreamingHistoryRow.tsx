import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { timeAgo } from "@shared/helpers/formatDate";
import { readStreamingHistory, summariseStreamingHistory, type StreamingHistory } from "@/lib/streamingHistory";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SettingsRow } from "@/components/settings/SettingsRow";
import styles from "./StreamingHistoryRow.module.css";

const count = (value: number) => value.toLocaleString("en-GB");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

async function readFiles(fileList: FileList): Promise<StreamingHistory> {
  const files = [];
  for (const file of fileList) {
    let rows: unknown;
    try {
      rows = JSON.parse(await file.text());
    } catch {
      throw new Error(`${file.name} isn't a JSON file.`);
    }
    files.push({ name: file.name, rows });
  }
  return readStreamingHistory(files);
}

interface LastImport {
  importedAt: string;
  saved: number;
  from: string;
  to: string;
}

function describeLastImport(lastImport: LastImport | null): string[] {
  if (!lastImport) return ["Never imported"];
  return [`Last import ${timeAgo(lastImport.importedAt)}: ${count(lastImport.saved)} plays from ${day(lastImport.from)} to ${day(lastImport.to)}`];
}

/** The settings row that imports Spotify's extended streaming history. It shows a dry run before anything is saved. */
export function StreamingHistoryRow({ lastImport }: { lastImport: LastImport | null }) {
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<StreamingHistory | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const summary = history ? summariseStreamingHistory(history.plays) : null;

  const savedInRange = useQuery({
    queryKey: queryKeys.settings.playsInRange(summary?.from ?? "", summary?.to ?? ""),
    queryFn: () => handle(client.api.listening.plays.count.$get({ query: { from: summary?.from ?? "", to: summary?.to ?? "" } })),
    enabled: summary !== null,
  });

  const importing = useMutation({
    mutationFn: (plays: StreamingHistory["plays"]) => handle(client.api.listening.import.$post({ json: { plays } })),
    onSuccess: () => {
      setHistory(null);
      // The import starts the track and genre lookups, so their rows pick them up straight away
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.running });
      return queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });

  async function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    importing.reset();
    setHistory(null);
    setReadError(null);
    if (!fileList || fileList.length === 0) return;

    try {
      setHistory(await readFiles(fileList));
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "The files couldn't be read.");
    }
  }

  return (
    <SettingsRow
      title="Streaming history"
      description="Imports every play from Spotify's extended streaming history. Choose the Streaming_History_Audio files from the export."
      details={describeLastImport(lastImport)}
      action={
        summary && (
          <Button onClick={() => importing.mutate(history?.plays ?? [])} disabled={importing.isPending || !savedInRange.isSuccess}>
            {importing.isPending ? `Importing ${count(summary.playCount)} plays…` : `Import ${count(summary.playCount)} plays`}
          </Button>
        )
      }
    >
      <Input
        className={styles.files}
        type="file"
        accept=".json,application/json"
        multiple
        onChange={event => void chooseFiles(event)}
        disabled={importing.isPending}
        aria-label="Streaming history files"
      />
      {readError && (
        <p className={styles.error} role="alert">
          {readError}
        </p>
      )}
      {history && !summary && <p>These files have no plays to import.</p>}
      {summary && history && (
        <div className={styles.summary}>
          <p>
            {day(summary.from)} to {day(summary.to)}
          </p>
          <p>
            {count(summary.playCount)} plays, and {count(summary.streamCount)} of them lasted 30 seconds or more
          </p>
          {history.skippedCount > 0 && <p className={styles.muted}>{count(history.skippedCount)} rows skipped, such as podcasts and audiobooks</p>}
          {savedInRange.data && <p className={styles.muted}>Replaces the {count(savedInRange.data.count)} plays already saved in this range</p>}
        </div>
      )}
      {importing.isError && (
        <p className={styles.error} role="alert">
          The import failed: {importing.error.message}
        </p>
      )}
      {importing.data && (
        <p>
          Saved {count(importing.data.saved)} plays and replaced {count(importing.data.removed)}.
        </p>
      )}
    </SettingsRow>
  );
}
