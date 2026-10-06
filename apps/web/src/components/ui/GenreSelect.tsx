import { useMemo } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import styles from "./GenreSelect.module.css";

import type { GenreCount } from "@shared/types";

interface GenreSelectProps {
  /** Every genre with its album count, in the order to list them */
  genres: GenreCount[];
  /** The picked genre slugs */
  selected: string[];
  onChange: (slugs: string[]) => void;
}

/**
 * The genre filter: a button that opens a searchable list of genres to tick.
 * Picking several shows albums in any of them, and the button counts the picks.
 */
export function GenreSelect({ genres, selected, onChange }: GenreSelectProps) {
  const items = useMemo(() => Combobox.createItems(genres, { getValue: genre => genre.slug, getLabel: genre => genre.name }), [genres]);

  return (
    <Combobox.Root
      items={items}
      multiple
      value={selected}
      onValueChange={onChange}
      onInputValueChange={(_value, eventDetails) => {
        // Keeps the search text after a tick, so several matches can be picked from one search
        if (eventDetails.isItemPress) eventDetails.cancel();
      }}
    >
      <Combobox.Trigger className={styles.trigger} aria-label={selected.length > 0 ? `Genres, ${selected.length} picked` : "Genres"}>
        Genres
        {selected.length > 0 && <span className={styles.count}>{selected.length}</span>}
        <CaretDownIcon weight="bold" aria-hidden="true" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.positioner} align="end" sideOffset={14} alignOffset={-12}>
          <Combobox.Popup className={styles.menu} aria-label="Genres">
            <Combobox.Input className={styles.search} placeholder="Find a genre" aria-label="Find a genre" />
            <Combobox.Empty className={styles.empty}>No genre called that.</Combobox.Empty>
            <Combobox.List className={styles.list}>
              {(genre: GenreCount) => (
                <Combobox.Item key={genre.slug} value={genre.slug} className={styles.item}>
                  <span className={styles.tick}>
                    <CheckIcon weight="bold" aria-hidden="true" />
                  </span>
                  <span>{genre.name}</span>
                  <small className={styles.albumCount}>{genre.albumCount}</small>
                </Combobox.Item>
              )}
            </Combobox.List>
            <div className={styles.footer}>
              <span>{selected.length > 0 ? `${selected.length} picked` : "Any genre"}</span>
              <button type="button" className={styles.clear} disabled={selected.length === 0} onClick={() => onChange([])}>
                Clear
              </button>
            </div>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
