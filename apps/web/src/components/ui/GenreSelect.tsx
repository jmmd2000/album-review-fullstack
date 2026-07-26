import { useEffect, useMemo, useRef, useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";
import styles from "./GenreSelect.module.css";

// Only the fields the dropdown actually renders, so the serialised API shape
// (dates as strings over the wire) satisfies it without a Genre type clash.
interface GenreOption {
  name: string;
  slug: string;
}

interface GenreSelectProps {
  genres: GenreOption[];
  relatedGenres?: GenreOption[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}

export function GenreSelect({ genres, relatedGenres, selected, onChange }: GenreSelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useDismiss(wrapperRef, () => setOpen(false));

  useEffect(() => {
    if (open && filterRef.current) {
      filterRef.current.focus();
    }
  }, [open]);

  const availableGenres = useMemo(() => {
    if (selected.length === 0 || !relatedGenres) {
      return [...genres].sort((a, b) => a.name.localeCompare(b.name));
    }
    const selectedSet = new Set(selected);
    const selectedGenres = genres.filter(genre => selectedSet.has(genre.slug));
    const narrowed = relatedGenres.filter(genre => !selectedSet.has(genre.slug));
    return [...selectedGenres, ...narrowed].sort((a, b) => a.name.localeCompare(b.name));
  }, [genres, relatedGenres, selected]);

  const filtered = useMemo(() => {
    if (!filter) return availableGenres;
    const lower = filter.toLowerCase();
    return availableGenres.filter(genre => genre.name.toLowerCase().includes(lower));
  }, [availableGenres, filter]);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter(s => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button type="button" className={styles.trigger} onClick={() => setOpen(prev => !prev)} aria-expanded={open}>
        <span className={styles.trigger_label}>{selected.length > 0 ? "Genres" : "All Genres"}</span>
        {selected.length > 0 && <span className={styles.trigger_count}>{selected.length}</span>}
        <span className={styles.chevron} data-open={open || undefined}>
          {"▾"}
        </span>
      </button>
      {open && (
        <div className={styles.menu}>
          <input ref={filterRef} className={styles.filter} type="text" placeholder="Filter genres..." value={filter} onChange={event => setFilter(event.target.value)} />
          {filtered.map(genre => (
            <button
              key={genre.slug}
              type="button"
              className={styles.item}
              aria-pressed={selected.includes(genre.slug)}
              data-selected={selected.includes(genre.slug) || undefined}
              onClick={() => toggle(genre.slug)}
            >
              <span className={styles.checkbox} data-checked={selected.includes(genre.slug) || undefined} />
              <span className={styles.item_label}>{genre.name}</span>
            </button>
          ))}
          {selected.length > 0 && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                onChange([]);
                setFilter("");
              }}
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
