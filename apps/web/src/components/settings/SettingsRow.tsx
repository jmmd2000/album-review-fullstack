import styles from "./SettingsRow.module.css";

import type { ReactNode } from "react";

interface SettingsRowProps {
  title: string;
  description: string;
  /** Short lines under the description, such as when the task last ran */
  details: string[];
  /** The button or control that goes with the row */
  action: ReactNode;
  /** The progress or the results, shown under the row */
  children?: ReactNode;
}

/** One admin setting or task: what it does, its status, and the control for it. */
export function SettingsRow({ title, description, details, action, children }: SettingsRowProps) {
  return (
    <section className={styles.row}>
      <div className={styles.head}>
        <div className={styles.text}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
          {details.length > 0 && (
            <div className={styles.details}>
              {details.map(detail => (
                <p key={detail}>{detail}</p>
              ))}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
