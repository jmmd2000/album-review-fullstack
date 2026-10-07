import { Link } from "@tanstack/react-router";
import { PAGE_SIZE } from "@shared/constants";
import { pageNumbers } from "@/lib/pageNumbers";
import styles from "./Pagination.module.css";

interface PaginationProps {
  /** The current page, from the route's search params. */
  page: number;
  totalCount: number;
}

/** Links to the other pages of a list, keeping the rest of the URL's search params. */
export function Pagination({ page, totalCount }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1) return null;

  // Page one is the default, so it has no page param. explicitUndefined below
  // stops that link counting as the current page on every page
  const searchFor = (target: number) => (previous: Record<string, unknown>) => ({ ...previous, page: target === 1 ? undefined : target });

  return (
    <nav className={styles.pages} aria-label="Pages">
      {page > 1 && (
        <Link to="." search={searchFor(page - 1)} className={styles.step}>
          Previous page
        </Link>
      )}
      <span className={styles.numbers}>
        {pageNumbers(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} aria-hidden="true">
              …
            </span>
          ) : (
            <Link key={entry} to="." search={searchFor(entry)} activeOptions={{ explicitUndefined: true }} className={styles.number} aria-label={`Page ${entry}`}>
              {entry}
            </Link>
          )
        )}
      </span>
      {page < totalPages && (
        <Link to="." search={searchFor(page + 1)} className={styles.step}>
          Next page
        </Link>
      )}
    </nav>
  );
}
