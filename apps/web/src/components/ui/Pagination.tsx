import { Button } from "@/components/ui/Button";
import styles from "./Pagination.module.css";

interface PaginationProps {
  pagination: {
    next: { action: () => void; disabled: boolean };
    prev: { action: () => void; disabled: boolean };
    page: { pageNumber: number; totalPages: number; totalCount: number; pageSize: number };
  };
}

export function Pagination({ pagination }: PaginationProps) {
  const { pageNumber, pageSize, totalCount } = pagination.page;
  const rangeStart = (pageNumber - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNumber * pageSize, totalCount);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <Button variant="outlined" type="button" onClick={pagination.prev.action} disabled={pagination.prev.disabled}>
        Previous
      </Button>
      <span className={styles.page}>
        {rangeStart}–{rangeEnd} of {totalCount}
      </span>
      <Button variant="outlined" type="button" onClick={pagination.next.action} disabled={pagination.next.disabled}>
        Next
      </Button>
    </nav>
  );
}
