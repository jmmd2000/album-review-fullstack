import type { ReactNode } from "react";
import styles from "./CardGrid.module.css";

interface CardGridProps {
  children: ReactNode;
}

export function CardGrid({ children }: CardGridProps) {
  return <div className={styles.grid}>{children}</div>;
}
