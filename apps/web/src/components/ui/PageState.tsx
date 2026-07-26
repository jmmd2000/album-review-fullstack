import type { ReactNode } from "react";
import styles from "./PageState.module.css";

interface PageStateProps {
  title: string;
  detail?: string;
  children?: ReactNode;
}

export function PageState({ title, detail, children }: PageStateProps) {
  return (
    <div className={styles.state} role="status">
      <p className={styles.title}>{title}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {children}
    </div>
  );
}
