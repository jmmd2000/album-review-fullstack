import { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { genreKey, hasGenre, pickerRows, splitMatch } from "@/lib/genrePicker";
import listbox from "@/styles/listbox.module.css";
import styles from "./GenreChips.module.css";

import type { KeyboardEvent } from "react";
import type { GenreCount } from "@shared/types";
import type { PickerRow } from "@/lib/genrePicker";

interface GenreChipsProps {
  genres: string[];
  /** Every genre with its album count, most used first, offered while typing */
  options: GenreCount[];
  /** Genres MusicBrainz suggests, most voted first. `isNew` marks one the genre list doesn't have yet. */
  suggestions: { name: string; isNew: boolean }[];
  onChange: (genres: string[]) => void;
}

const rowLabel = (row: PickerRow) => (row.kind === "genre" ? row.genre.name : row.name);

/**
 * The album's genres as removable chips, suggested genres to tap, and a box to add one. Its list offers
 * existing genres, most used first, and ends with a row to add what's typed as a new genre when no genre
 * has that name.
 */
export function GenreChips({ genres, options, suggestions, onChange }: GenreChipsProps) {
  const [query, setQuery] = useState("");
  const rows = pickerRows(options, query, genres);
  const pickedKeys = new Set(genres.map(genreKey));
  const openSuggestions = suggestions.filter(suggestion => !pickedKeys.has(genreKey(suggestion.name)));
  // Enter only picks a row straight away when it starts with the text, so it never adds a genre that merely contains it
  const firstRowStartsWithText = rows[0]?.kind === "genre" && query.trim() !== "" && rows[0].genre.name.toLowerCase().startsWith(query.trim().toLowerCase());

  const add = (name: string) => {
    setQuery("");
    if (hasGenre(genres, name)) return;
    onChange([...genres, name.trim()]);
  };

  // Enter would submit the review when no row is highlighted. The list still picks a highlighted row.
  const stopSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.preventDefault();
  };

  return (
    <div className={styles.genres}>
      {genres.length > 0 && (
        <ul className={styles.chips}>
          {genres.map(genre => (
            <li key={genre} className={styles.chip}>
              {genre}
              <button type="button" aria-label={`Remove ${genre}`} onClick={() => onChange(genres.filter(other => other !== genre))}>
                <XIcon weight="bold" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {openSuggestions.length > 0 && (
        <ul className={styles.suggestions} aria-label="Suggested genres">
          {openSuggestions.map(suggestion => (
            <li key={suggestion.name}>
              <button type="button" className={styles.suggestion} aria-label={suggestion.isNew ? `Add ${suggestion.name}, a new genre` : `Add ${suggestion.name}`} onClick={() => add(suggestion.name)}>
                <PlusIcon weight="bold" aria-hidden="true" />
                {suggestion.name}
                {suggestion.isNew && <span className={styles.new}>new</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Combobox.Root<PickerRow>
        items={rows}
        filter={null}
        value={null}
        inputValue={query}
        onInputValueChange={setQuery}
        onValueChange={row => {
          if (row) add(rowLabel(row));
        }}
        itemToStringLabel={rowLabel}
        autoHighlight={firstRowStartsWithText}
        openOnInputClick
      >
        <Combobox.Input className={styles.input} placeholder="Add a genre" aria-label="Add a genre" onKeyDown={stopSubmit} />
        <Combobox.Portal>
          <Combobox.Positioner className={`${listbox.positioner} ${styles.positioner}`} sideOffset={6}>
            <Combobox.Popup className={listbox.popup}>
              <Combobox.Empty className={listbox.empty}>Nothing else matches.</Combobox.Empty>
              <Combobox.List className={listbox.list}>
                {(row: PickerRow) =>
                  row.kind === "genre" ? (
                    <Combobox.Item key={row.genre.slug} value={row} className={`${listbox.row} ${styles.row}`}>
                      <MatchedName name={row.genre.name} query={query} />
                      <small className={listbox.albumCount}>{row.genre.albumCount}</small>
                    </Combobox.Item>
                  ) : (
                    <Combobox.Item key="new-genre" value={row} className={`${listbox.row} ${styles.row}`}>
                      <span>
                        Add <b>{row.name}</b> as a new genre
                      </span>
                    </Combobox.Item>
                  )
                }
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

function MatchedName({ name, query }: { name: string; query: string }) {
  const { before, match, after } = splitMatch(name, query);
  return (
    <span>
      {before}
      {match && <b>{match}</b>}
      {after}
    </span>
  );
}
