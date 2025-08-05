import { Progress } from "@shared/types";
import { useReducer } from "react";

export type ProgressState = {
  // Current progress indicators
  fetchingProgress: Progress | null;
  currentProgress: Progress | null;
  sameProgress: Progress | null;

  // Completion state
  isDone: boolean;
  total: number | null;

  // Accumulated results
  sameEntries: Progress[];
  changedEntries: Progress[];
  errorEntries: Progress[];

  // UI state
  dismissedBanner: boolean;
};

type ProgressAction =
  | { type: "FETCHING_PROGRESS"; payload: Progress }
  | { type: "PROGRESS"; payload: Progress }
  | { type: "SAME_RESULT"; payload: Progress }
  | { type: "CHANGED_RESULT"; payload: Progress }
  | { type: "ERROR_RESULT"; payload: Progress }
  | { type: "DONE" }
  | { type: "RESET" }
  | { type: "DISMISS_BANNER" };

// Initial state
const initialProgressState: ProgressState = {
  fetchingProgress: null,
  currentProgress: null,
  sameProgress: null,
  isDone: false,
  total: null,
  sameEntries: [],
  changedEntries: [],
  errorEntries: [],
  dismissedBanner: false,
};

function progressReducer(
  state: ProgressState,
  action: ProgressAction
): ProgressState {
  switch (action.type) {
    case "FETCHING_PROGRESS":
      // Show fetching progress, clear other progress states
      return {
        ...state,
        fetchingProgress: action.payload,
        currentProgress: null,
        sameProgress: null,
        total: action.payload.total,
      };

    case "PROGRESS":
      // Just for live updates
      return {
        ...state,
        currentProgress: action.payload,
        sameProgress: null,
        total: action.payload.total,
      };

    case "SAME_RESULT":
      return {
        ...state,
        sameProgress: action.payload,
        total: action.payload.total,
        sameEntries: [...state.sameEntries, action.payload],
      };

    case "CHANGED_RESULT":
      return {
        ...state,
        total: action.payload.total,
        changedEntries: [...state.changedEntries, action.payload],
      };

    case "ERROR_RESULT":
      return {
        ...state,
        currentProgress: null,
        sameProgress: null,
        total: action.payload.total,
        errorEntries: [...state.errorEntries, action.payload],
      };

    case "DONE":
      return {
        ...state,
        isDone: true,
        currentProgress: null,
        sameProgress: null,
      };

    case "RESET":
      return initialProgressState;

    case "DISMISS_BANNER":
      return {
        ...state,
        dismissedBanner: true,
      };

    default:
      return state;
  }
}

// Custom hook for using the progress reducer
export function useProgressState() {
  const [imageState, imageDispatch] = useReducer(
    progressReducer,
    initialProgressState
  );
  const [headerState, headerDispatch] = useReducer(
    progressReducer,
    initialProgressState
  );

  return {
    // Image state
    imageState,
    imageDispatch,

    // Header state
    headerState,
    headerDispatch,

    // Helper functions
    resetImageState: () => imageDispatch({ type: "RESET" }),
    resetHeaderState: () => headerDispatch({ type: "RESET" }),
    dismissImageBanner: () => imageDispatch({ type: "DISMISS_BANNER" }),
    dismissHeaderBanner: () => headerDispatch({ type: "DISMISS_BANNER" }),
  };
}
