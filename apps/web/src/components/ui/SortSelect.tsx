import { useRef, useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { useDismiss } from "@/hooks/useDismiss";
import styles from "./SortSelect.module.css";

export interface SortOption {
  label: string;
  value: string;
}

interface SortSelectProps {
  options: SortOption[];
  value: string;
  direction: "asc" | "desc";
  onSortChange: (value: string, direction: "asc" | "desc") => void;
}

export function SortSelect({ options, value, direction, onSortChange }: SortSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = options.find(option => option.value === value);

  useDismiss(wrapperRef, () => setOpen(false));

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.row}>
        <button type="button" className={styles.trigger} onClick={() => setOpen(prev => !prev)} aria-expanded={open}>
          <span className={styles.label}>{selected?.label ?? "Sort by..."}</span>
          <span className={styles.chevron} data-open={open || undefined}>
            {"▾"}
          </span>
        </button>
        <button
          type="button"
          className={styles.direction}
          onClick={() => onSortChange(value, direction === "asc" ? "desc" : "asc")}
          aria-label={direction === "asc" ? "Sort descending" : "Sort ascending"}
        >
          {direction === "asc" ? <ArrowUpIcon weight="bold" size={16} /> : <ArrowDownIcon weight="bold" size={16} />}
        </button>
      </div>
      {open && (
        <ul className={styles.menu}>
          {options.map(option => (
            <li key={option.value}>
              <button
                type="button"
                className={styles.item}
                aria-current={option.value === value || undefined}
                data-active={option.value === value || undefined}
                onClick={() => {
                  onSortChange(option.value, direction);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
