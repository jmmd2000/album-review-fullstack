import styles from "./ResultDetails.module.css";

import type { ReactNode } from "react";

interface ResultDetailsProps {
  label: string;
  children: ReactNode;
}

/** A task's full results, closed until its label is clicked. */
export function ResultDetails({ label, children }: ResultDetailsProps) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{label}</summary>
      {children}
    </details>
  );
}
