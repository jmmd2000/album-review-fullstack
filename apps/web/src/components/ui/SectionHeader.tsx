import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  /** Soft text at the other end, such as the sort order */
  aside?: string;
}

/** A section's heading, ruled off underneath. */
export function SectionHeader({ title, aside }: SectionHeaderProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {aside && <span className={styles.aside}>{aside}</span>}
      </div>
    </div>
  );
}
