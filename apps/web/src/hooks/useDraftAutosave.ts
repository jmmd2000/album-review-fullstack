import { useCallback, useEffect, useRef, useState } from "react";

import type { ReviewFormValues } from "@/lib/reviewForm";

const SAVE_DELAY_MS = 1000;

export type DraftSaveStatus = { state: "idle" } | { state: "saved"; at: Date } | { state: "failed" };

/**
 * Saves the review form as a draft a second after its last change, and straight away when the tab is
 * hidden, the page closes or the form unmounts. Nothing saves until the first change.
 *
 * @param save Sends the values. `keepalive` is true when the page may be closing, so the request outlives it.
 * @returns `change` to call with the new values on every change, `stop` to call before the review saves,
 *   so no draft lands after it, `resume` to undo `stop` when that save fails, and the last save's status.
 */
export function useDraftAutosave(save: (values: ReviewFormValues, keepalive: boolean) => Promise<void>) {
  const pending = useRef<ReviewFormValues | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const stopped = useRef(false);
  const [status, setStatus] = useState<DraftSaveStatus>({ state: "idle" });

  const flush = useCallback(
    (keepalive: boolean) => {
      window.clearTimeout(timer.current);
      const values = pending.current;
      if (!values || stopped.current) return;

      pending.current = null;
      save(values, keepalive).then(
        () => setStatus({ state: "saved", at: new Date() }),
        () => setStatus({ state: "failed" })
      );
    },
    [save]
  );

  useEffect(() => {
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    const saveOnClose = () => flush(true);

    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveOnClose);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveOnClose);
      flush(true);
    };
  }, [flush]);

  const change = (values: ReviewFormValues) => {
    if (stopped.current) return;
    pending.current = values;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => flush(false), SAVE_DELAY_MS);
  };

  const stop = () => {
    stopped.current = true;
    pending.current = null;
    window.clearTimeout(timer.current);
  };

  const resume = () => {
    stopped.current = false;
  };

  return { change, stop, resume, status };
}
