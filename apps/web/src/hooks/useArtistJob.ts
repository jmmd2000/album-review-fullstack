import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { formatJobCounts } from "@/lib/jobStatus";

import type { JobEventMap, Progress } from "@shared/types";

export type ArtistJob = "artist-images" | "artist-headers" | "listener-links" | "album-suggestions" | "played-tracks" | "played-genres";

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
  "listener-links": "Listener links",
  "album-suggestions": "Album suggestions",
  "played-tracks": "Played tracks",
  "played-genres": "Played artist genres",
};

/** The counts of a job's results, such as "4 updated, 130 unchanged, 2 failed". */
export function summariseArtistJob(state: ArtistJobState) {
  return formatJobCounts(state.changed.length, state.unchangedCount, state.failed.length);
}

/** Listens for one job event and hands the handler its parsed payload. */
function listen<Name extends keyof JobEventMap>(source: EventSource, name: Name, handler: (data: JobEventMap[Name]) => void) {
  source.addEventListener(name, event => handler(JSON.parse((event as MessageEvent<string>).data) as JobEventMap[Name]));
}

// How often a row asks the server whether its job was started somewhere else, such as by an import
const RUNNING_CHECK_MS = 10_000;

/**
 * Starts an artist job and follows its progress events. The row also asks the server which jobs are running,
 * so it follows a run started before a refresh, on another device or by an import. When the job finishes,
 * it shows a toast and refreshes the artists and the last run times.
 */
export function useArtistJob(job: ArtistJob) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ArtistJobState>(IDLE);
  const sourceRef = useRef<EventSource | null>(null);
  const followedJobIDRef = useRef<string | null>(null);
  const running = useQuery({
    queryKey: queryKeys.jobs.running,
    queryFn: () => handle(client.api.jobs.running.$get()),
    refetchInterval: RUNNING_CHECK_MS,
  });
  const runningJobID = running.data?.running[job] ?? null;

  const follow = useCallback(
    (jobID: string) => {
      followedJobIDRef.current = jobID;
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
        update({ status: "finished", current: null });

        if (latest.error) {
          toast.error(`${JOB_LABELS[job]} stopped early`);
        } else {
          toast.success(`${JOB_LABELS[job]}: ${summariseArtistJob(latest)}`);
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.settings.lastRuns });
        void queryClient.invalidateQueries({ queryKey: queryKeys.settings.jobResults });
        void queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.discover });
      });

      // EventSource retries a dropped connection by itself, and the server resumes after the last event.
      // It only closes when the job is gone, such as after a server restart.
      source.onerror = () => {
        if (source.readyState !== EventSource.CLOSED) return;
        setState(IDLE);
      };
    },
    [job, queryClient]
  );

  useEffect(() => {
    if (runningJobID && runningJobID !== followedJobIDRef.current) follow(runningJobID);
  }, [runningJobID, follow]);

  useEffect(() => () => sourceRef.current?.close(), []);

  const start = useCallback(async () => {
    setState({ ...IDLE, status: "running" });
    try {
      const { jobID } = await handle(client.api.jobs[":name"].$post({ param: { name: job } }));
      follow(jobID);
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409 ? error.message : "The job couldn't start. Try again.";
      setState({ ...IDLE, status: "finished", error: message });
    }
  }, [job, follow]);

  return { state, start };
}
