import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Progress } from "@shared/types";
import type { JobState } from "@/components/settings/SettingsCard";
import { client, handle } from "@/lib/client";

type JobAction =
  | { type: "START" }
  | { type: "FETCHING"; payload: Progress }
  | { type: "PROGRESS"; payload: Progress }
  | { type: "SAME"; payload: Progress }
  | { type: "CHANGED"; payload: Progress }
  | { type: "ERROR"; payload: Progress }
  | { type: "DONE" }
  | { type: "DISMISS" }
  | { type: "RESET" };

const initialState: JobState = {
  phase: "idle",
  current: null,
  currentPhase: "processing",
  index: 0,
  total: 0,
  results: { same: [], changed: [], errors: [] },
  dismissed: false,
};

function jobReducer(state: JobState, action: JobAction): JobState {
  switch (action.type) {
    case "START":
      return { ...initialState, phase: "running" };

    case "FETCHING":
      return {
        ...state,
        phase: "running",
        current: action.payload,
        currentPhase: "fetching",
        index: action.payload.index,
        total: action.payload.total,
      };

    case "PROGRESS":
      return {
        ...state,
        phase: "running",
        current: action.payload,
        currentPhase: "processing",
        index: action.payload.index,
        total: action.payload.total,
      };

    case "SAME":
      return {
        ...state,
        index: action.payload.index,
        total: action.payload.total,
        results: { ...state.results, same: [...state.results.same, action.payload] },
      };

    case "CHANGED":
      return {
        ...state,
        index: action.payload.index,
        total: action.payload.total,
        results: { ...state.results, changed: [...state.results.changed, action.payload] },
      };

    case "ERROR":
      return {
        ...state,
        index: action.payload.index,
        total: action.payload.total,
        results: { ...state.results, errors: [...state.results.errors, action.payload] },
      };

    case "DONE":
      return { ...state, phase: "complete", current: null };

    case "DISMISS":
      return { ...state, dismissed: true };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

type DataAction = Extract<JobAction, { payload: Progress }>;

// SSE event name -> reducer action. "failed" rather than "error" because
// EventSource reserves the "error" event for its own connection failures.
const EVENT_ACTIONS: Record<string, DataAction["type"]> = {
  fetching: "FETCHING",
  progress: "PROGRESS",
  same: "SAME",
  changed: "CHANGED",
  failed: "ERROR",
};

interface UseJobProgressOptions {
  /** Which artist job to start, maps to POST /api/jobs/:job and returns { jobID }. */
  job: "artist-images" | "artist-headers";
}

export function useJobProgress({ job }: UseJobProgressOptions) {
  const [state, dispatch] = useReducer(jobReducer, initialState);
  const sourceRef = useRef<EventSource | null>(null);
  const storageKey = `jobID:${job}`;

  const stop = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  // Open an SSE stream for a running job and feed its events into the reducer.
  const listen = useCallback(
    (jobID: string) => {
      stop();
      const source = new EventSource(`/api/jobs/${jobID}/events`, { withCredentials: true });
      sourceRef.current = source;

      for (const [event, type] of Object.entries(EVENT_ACTIONS)) {
        source.addEventListener(event, e => dispatch({ type, payload: JSON.parse((e as MessageEvent).data) as Progress } as DataAction));
      }

      source.addEventListener("done", () => {
        dispatch({ type: "DONE" });
        localStorage.removeItem(storageKey);
        stop();
      });

      // Only a fatal error (job gone / 404) leaves the source CLOSED, a transient
      // drop stays CONNECTING and EventSource retries, resuming via Last-Event-ID.
      source.onerror = () => {
        if (source.readyState === EventSource.CLOSED) {
          localStorage.removeItem(storageKey);
          stop();
          dispatch({ type: "RESET" });
        }
      };
    },
    [storageKey, stop]
  );

  // Reattach to a job still running (or recently finished) after a remount.
  useEffect(() => {
    const running = localStorage.getItem(storageKey);
    if (running) listen(running);
    return stop;
  }, [storageKey, listen, stop]);

  const trigger = useCallback(async () => {
    dispatch({ type: "START" });
    try {
      const { jobID } = await handle(client.api.jobs[job].$post());
      localStorage.setItem(storageKey, jobID);
      listen(jobID);
    } catch {
      dispatch({ type: "RESET" });
    }
  }, [job, storageKey, listen]);

  const dismiss = useCallback(() => dispatch({ type: "DISMISS" }), []);

  const reset = useCallback(() => {
    stop();
    localStorage.removeItem(storageKey);
    dispatch({ type: "RESET" });
  }, [storageKey, stop]);

  return { state, trigger, dismiss, reset };
}
