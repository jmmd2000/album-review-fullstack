import type { ReactNode } from "react";
import styles from "./PageState.module.css";

interface PageStateProps {
  title: string;
  detail?: string;
  /** Small label above the title, e.g. a status code or category. */
  marker?: string;
  /** "status" for empty results, "alert" for failures. */
  role?: "status" | "alert";
  /** Actions such as a retry button or a back link. */
  children?: ReactNode;
}

export function PageState({ title, detail, marker, role = "status", children }: PageStateProps) {
  return (
    <div className={styles.state} role={role}>
      <span className={styles.spectrum} aria-hidden="true" />
      {marker && <span className={styles.marker}>{marker}</span>}
      <p className={styles.title}>{title}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
