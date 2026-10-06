import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  count?: number;
  children?: ReactNode;
}

export function PageHeader({ title, count, children }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        {title}
        {count !== undefined && <span className={styles.count}>{count.toLocaleString("en-GB")}</span>}
      </h1>
      {children && <div className={styles.controls}>{children}</div>}
    </header>
  );
}
