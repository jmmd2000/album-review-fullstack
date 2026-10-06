import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import styles from "./SortTabs.module.css";

type Direction = "asc" | "desc";

export interface SortOption {
  label: string;
  value: string;
  /** The order a first click gives. Clicking the selected tab again reverses it. */
  direction: Direction;
}

interface SortTabsProps {
  options: SortOption[];
  value: string;
  direction: Direction;
  onSortChange: (value: string, direction: Direction) => void;
}

export function SortTabs({ options, value, direction, onSortChange }: SortTabsProps) {
  const flipped = direction === "asc" ? "desc" : "asc";

  return (
    <div className={styles.tabs} role="group" aria-label="Sort">
      {options.map(option => {
        const selected = option.value === value;

        return (
          <button key={option.value} type="button" className={styles.tab} aria-pressed={selected} onClick={() => onSortChange(option.value, selected ? flipped : option.direction)}>
            {option.label}
            {selected && (
              <>
                {direction === "asc" ? <ArrowUpIcon weight="bold" aria-hidden="true" /> : <ArrowDownIcon weight="bold" aria-hidden="true" />}
                <span className={styles.hidden}>{direction === "asc" ? ", ascending" : ", descending"}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
