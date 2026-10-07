import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";

import type { JobEventMap, Progress } from "@shared/types";

export type ArtistJob = "artist-images" | "artist-headers";

export interface ArtistJobState {
  status: "idle" | "running" | "finished";
  /** The artist the job is on now */
  current: Progress | null;
  changed: Progress[];
  unchangedCount: number;
  failed: JobEventMap["failed"][];
  /** Why the job stopped early or didn't start, as a sentence to show */
  error: string | null;
}

const IDLE: ArtistJobState = { status: "idle", current: null, changed: [], unchangedCount: 0, failed: [], error: null };

const JOB_LABELS: Record<ArtistJob, string> = {
  "artist-images": "Artist photos",
  "artist-headers": "Artist headers",
};

/** The counts of a job's results, such as "4 updated, 130 unchanged, 2 failed". */
export function summariseArtistJob(state: ArtistJobState) {
  const parts = [`${state.changed.length} updated`, `${state.unchangedCount} unchanged`];
  if (state.failed.length > 0) parts.push(`${state.failed.length} failed`);
  return parts.join(", ");
}

/** Listens for one job event and hands the handler its parsed payload. */
function listen<Name extends keyof JobEventMap>(source: EventSource, name: Name, handler: (data: JobEventMap[Name]) => void) {
  source.addEventListener(name, event => handler(JSON.parse((event as MessageEvent<string>).data) as JobEventMap[Name]));
}

/**
 * Starts an artist job and follows its progress events. The job ID is kept in local storage,
 * so the page follows a job that is still running when it opens again. When the job finishes,
 * it shows a toast and refreshes the artists and the last run times.
 */
export function useArtistJob(job: ArtistJob) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ArtistJobState>(IDLE);
  const sourceRef = useRef<EventSource | null>(null);
  const storageKey = `jobID:${job}`;

  const follow = useCallback(
    (jobID: string) => {
      sourceRef.current?.close();
      const source = new EventSource(`/api/jobs/${jobID}/events`, { withCredentials: true });
      sourceRef.current = source;

      // The handlers below build on this copy, so each event sees the ones before it
      let latest: ArtistJobState = { ...IDLE, status: "running" };
      const update = (changes: Partial<ArtistJobState>) => {
        latest = { ...latest, ...changes };
        setState(latest);
      };
      update({});

      listen(source, "fetching", progress => update({ current: progress }));
      listen(source, "progress", progress => update({ current: progress }));
      listen(source, "same", () => update({ unchangedCount: latest.unchangedCount + 1 }));
      listen(source, "changed", progress => update({ changed: [...latest.changed, progress] }));
      listen(source, "failed", failure => update({ failed: [...latest.failed, failure] }));
      listen(source, "fatal", ({ message }) => update({ error: `The job stopped early: ${message}` }));

      listen(source, "done", () => {
        source.close();
        localStorage.removeItem(storageKey);
        update({ status: "finished", current: null });

        if (latest.error) {
          toast.error(`${JOB_LABELS[job]} stopped early`);
        } else {
          toast.success(`${JOB_LABELS[job]}: ${summariseArtistJob(latest)}`);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.lastRuns });
        queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
      });

      // EventSource retries a dropped connection by itself, and the server resumes after the last event.
      // It only closes when the job is gone, such as after a server restart.
      source.onerror = () => {
        if (source.readyState !== EventSource.CLOSED) return;
        localStorage.removeItem(storageKey);
        setState(IDLE);
      };
    },
    [job, storageKey, queryClient]
  );

  useEffect(() => {
    const runningJobID = localStorage.getItem(storageKey);
    if (runningJobID) follow(runningJobID);
    return () => sourceRef.current?.close();
  }, [storageKey, follow]);

  const start = useCallback(async () => {
    setState({ ...IDLE, status: "running" });
    try {
      const { jobID } = await handle(client.api.jobs[job].$post());
      localStorage.setItem(storageKey, jobID);
      follow(jobID);
    } catch {
      setState({ ...IDLE, status: "finished", error: "The job couldn't start. Try again." });
    }
  }, [job, storageKey, follow]);

  return { state, start };
}
