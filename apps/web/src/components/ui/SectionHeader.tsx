import styles from "./SectionHeader.module.css";

import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  /** Soft text at the other end, such as the sort order */
  aside?: string;
  /** A link at the other end, such as to the full list */
  link?: ReactNode;
}

/** A section's heading, ruled off underneath. */
export function SectionHeader({ title, aside, link }: SectionHeaderProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {aside && <span className={styles.aside}>{aside}</span>}
        {link && <span className={styles.link}>{link}</span>}
      </div>
    </div>
  );
}
