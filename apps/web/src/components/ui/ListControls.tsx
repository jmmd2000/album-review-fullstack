import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./ListControls.module.css";

interface ListControlsProps {
  searchLabel: string;
  searchValue: string;
  onSearch: (value: string) => void;
  pagination: {
    next: { action: () => void; disabled: boolean };
    prev: { action: () => void; disabled: boolean };
    page: { pageNumber: number; totalPages: number };
  };
}

export function ListControls({ searchLabel, searchValue, onSearch, pagination }: ListControlsProps) {
  return (
    <div className={styles.controls}>
      <form
        className={styles.search}
        onSubmit={event => {
          event.preventDefault();
          onSearch(new FormData(event.currentTarget).get("query")?.toString() ?? "");
        }}
      >
        <Input name="query" type="search" defaultValue={searchValue} aria-label={searchLabel} />
        <Button type="submit">Search</Button>
      </form>
      <nav className={styles.pagination} aria-label="Pagination">
        <Button variant="outlined" type="button" onClick={pagination.prev.action} disabled={pagination.prev.disabled}>
          Previous
        </Button>
        <span className={styles.page}>
          {pagination.page.pageNumber} / {pagination.page.totalPages}
        </span>
        <Button variant="outlined" type="button" onClick={pagination.next.action} disabled={pagination.next.disabled}>
          Next
        </Button>
      </nav>
    </div>
  );
}
