import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}

export function PageHeader({ title, eyebrow, children }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      </div>
      {children && <div className={styles.controls}>{children}</div>}
    </div>
  );
}
