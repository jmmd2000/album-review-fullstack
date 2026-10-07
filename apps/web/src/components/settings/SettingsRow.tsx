import { timeAgo } from "@shared/helpers/formatDate";
import { Button } from "@/components/ui/Button";
import styles from "./SettingsRow.module.css";

import type { ReactNode } from "react";

interface SettingsRowProps {
  title: string;
  description: string;
  /** When the task last finished, or null if it never ran */
  lastRun: string | null;
  actionLabel: string;
  onAction: () => void;
  isRunning: boolean;
  /** The progress or the results, shown under the row */
  children?: ReactNode;
}

/** One admin task: what it does, when it last ran, and the button that runs it. */
export function SettingsRow({ title, description, lastRun, actionLabel, onAction, isRunning, children }: SettingsRowProps) {
  return (
    <section className={styles.row}>
      <div className={styles.head}>
        <div className={styles.text}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
          <p className={styles.lastRun}>{isRunning ? "Running now" : lastRun ? `Last run ${timeAgo(lastRun)}` : "Never run"}</p>
        </div>
        <Button onClick={onAction} disabled={isRunning}>
          {isRunning ? "Running…" : actionLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}
