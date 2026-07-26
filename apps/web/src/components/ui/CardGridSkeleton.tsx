import { CardGrid } from "@/components/ui/CardGrid";
import styles from "./CardGridSkeleton.module.css";

interface CardGridSkeletonProps {
  count?: number;
}

export function CardGridSkeleton({ count = 18 }: CardGridSkeletonProps) {
  return (
    <CardGrid>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.cell} aria-hidden="true" />
      ))}
    </CardGrid>
  );
}
