import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import styles from "./GenreChips.module.css";

import type { KeyboardEvent } from "react";

interface GenreChipsProps {
  genres: string[];
  /** Every genre name, suggested while typing */
  suggestions: string[];
  onChange: (genres: string[]) => void;
}

/** The album's genres as removable chips, and a box to add one. Enter adds what's typed, new or not. */
export function GenreChips({ genres, suggestions, onChange }: GenreChipsProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    setDraft("");
    if (!name || genres.some(genre => genre.toLowerCase() === name.toLowerCase())) return;
    onChange([...genres, name]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    // Enter would submit the review
    event.preventDefault();
    add();
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
      <input
        className={styles.input}
        type="text"
        list="genre-suggestions"
        placeholder="Add a genre"
        aria-label="Add a genre"
        autoComplete="off"
        value={draft}
        onChange={event => setDraft(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      <datalist id="genre-suggestions">
        {suggestions.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
