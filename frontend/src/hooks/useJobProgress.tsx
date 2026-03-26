import { useCallback, useEffect, useReducer } from "react";
import { Progress } from "@shared/types";
import { Socket } from "socket.io-client";
import { JobState } from "@/components/settings/SettingsCard";

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
        results: {
          ...state.results,
          same: [...state.results.same, action.payload],
        },
      };

    case "CHANGED":
      return {
        ...state,
        index: action.payload.index,
        total: action.payload.total,
        results: {
          ...state.results,
          changed: [...state.results.changed, action.payload],
        },
      };

    case "ERROR":
      return {
        ...state,
        index: action.payload.index,
        total: action.payload.total,
        results: {
          ...state.results,
          errors: [...state.results.errors, action.payload],
        },
      };

    case "DONE":
      return {
        ...state,
        phase: "complete",
        current: null,
      };

    case "DISMISS":
      return {
        ...state,
        dismissed: true,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

interface UseJobProgressOptions {
  /** Socket instance */
  socket: Socket | null;
  /** Job that's triggered */
  job: string;
  /** Function that triggers the job */
  triggerFn: () => Promise<void>;
}

export function useJobProgress({ socket, job, triggerFn }: UseJobProgressOptions) {
  const [state, dispatch] = useReducer(jobReducer, initialState);

  // Subscribe to socket events
  useEffect(() => {
    if (!socket) return;

    const prefix = `artist:${job}`;

    const onFetching = (data: Progress) => dispatch({ type: "FETCHING", payload: data });
    const onProgress = (data: Progress) => dispatch({ type: "PROGRESS", payload: data });
    const onSame = (data: Progress) => dispatch({ type: "SAME", payload: data });
    const onChanged = (data: Progress) => dispatch({ type: "CHANGED", payload: data });
    const onError = (data: Progress) => dispatch({ type: "ERROR", payload: data });
    const onDone = () => dispatch({ type: "DONE" });

    socket.on(`${prefix}:fetching`, onFetching);
    socket.on(`${prefix}:progress`, onProgress);
    socket.on(`${prefix}:same`, onSame);
    socket.on(`${prefix}:changed`, onChanged);
    socket.on(`${prefix}:error`, onError);
    socket.on(`${prefix}:done`, onDone);

    return () => {
      socket.off(`${prefix}:fetching`, onFetching);
      socket.off(`${prefix}:progress`, onProgress);
      socket.off(`${prefix}:same`, onSame);
      socket.off(`${prefix}:changed`, onChanged);
      socket.off(`${prefix}:error`, onError);
      socket.off(`${prefix}:done`, onDone);
    };
  }, [socket, job]);

  const trigger = useCallback(async () => {
    dispatch({ type: "START" });
    try {
      await triggerFn();
    } catch {
      // trigger failed - the job never started
      dispatch({ type: "RESET" });
    }
  }, [triggerFn]);

  const dismiss = useCallback(() => dispatch({ type: "DISMISS" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, trigger, dismiss, reset };
}
