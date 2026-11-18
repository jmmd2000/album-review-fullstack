import { useEffect, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { savedAgo } from "@/lib/reviewDraft";
import { Button } from "@/components/ui/Button";
import dialogStyles from "@/styles/dialog.module.css";
import styles from "./DraftNotice.module.css";

import type { DraftSaveStatus } from "@/hooks/useDraftAutosave";

/** The time now, updated every 30 seconds, so "saved 2 min ago" stays right. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  return now;
}

interface DraftNoticeProps {
  /** When the draft was saved */
  savedAt: Date;
  /** False when the draft no longer matches the form and wasn't loaded */
  loaded: boolean;
  onDiscard: () => Promise<void>;
}

/** The bar above a review form that started from a draft, with a Discard button that asks first. */
export function DraftNotice({ savedAt, loaded, onDiscard }: DraftNoticeProps) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [failed, setFailed] = useState(false);

  const discard = async () => {
    setDiscarding(true);
    setFailed(false);
    try {
      await onDiscard();
      setOpen(false);
    } catch {
      setFailed(true);
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <div className={styles.notice} role="status">
      <p>{loaded ? `Loaded your draft, saved ${savedAgo(savedAt, now)}.` : `This album has a draft from ${savedAgo(savedAt, now)} that can't be loaded into the form.`}</p>
      <AlertDialog.Root
        open={open}
        onOpenChange={nextOpen => {
          if (discarding) return;
          setOpen(nextOpen);
          if (!nextOpen) setFailed(false);
        }}
      >
        <AlertDialog.Trigger render={<Button variant="secondary" />}>Discard</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={dialogStyles.backdrop} />
          <AlertDialog.Popup className={dialogStyles.popup}>
            <AlertDialog.Title className={dialogStyles.title}>Discard this draft?</AlertDialog.Title>
            <AlertDialog.Description className={dialogStyles.description}>The form starts again from nothing. This can't be undone.</AlertDialog.Description>
            {failed && (
              <p className={dialogStyles.error} role="alert">
                The draft couldn't be discarded. Try again.
              </p>
            )}
            <div className={dialogStyles.actions}>
              <AlertDialog.Close render={<Button variant="secondary" />} disabled={discarding}>
                Cancel
              </AlertDialog.Close>
              <Button variant="primary" onClick={() => void discard()} disabled={discarding}>
                {discarding ? "Discarding…" : "Discard draft"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

/** The line next to Save that says when the draft last saved, or that the last save failed. */
export function DraftStatus({ status }: { status: DraftSaveStatus }) {
  const now = useNow();
  if (status.state === "idle") return null;

  return (
    <p className={status.state === "failed" ? styles.failed : styles.status} role="status">
      {status.state === "saved" ? `Draft saved ${savedAgo(status.at, now)}` : "The draft couldn't be saved. It tries again on your next change."}
    </p>
  );
}
