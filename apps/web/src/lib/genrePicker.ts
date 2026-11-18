import type { GenreCount } from "@shared/types";

/** A row in the genre picker's list: a genre that exists, or the offer to add what's typed as a new one. */
export type PickerRow = { kind: "genre"; genre: GenreCount } | { kind: "create"; name: string };

/** Whether the picked genres already include this name, ignoring case and spaces at either end. */
export function hasGenre(picked: string[], name: string): boolean {
  const wanted = name.trim().toLowerCase();
  return picked.some(genre => genre.toLowerCase() === wanted);
}

/**
 * The rows the genre picker lists for the typed text, with picked genres left out. With nothing typed,
 * genres keep the order they come in, most used first. Otherwise names that start with the text come
 * first, then names that contain it. The last row offers to add the text as a new genre, unless a genre
 * with that exact name exists or is already picked.
 */
export function pickerRows(genres: GenreCount[], query: string, picked: string[]): PickerRow[] {
  const available = genres.filter(genre => !hasGenre(picked, genre.name));
  const text = query.trim().toLowerCase();
  if (!text) return available.map(genre => ({ kind: "genre", genre }));

  const startsWith = available.filter(genre => genre.name.toLowerCase().startsWith(text));
  const contains = available.filter(genre => !genre.name.toLowerCase().startsWith(text) && genre.name.toLowerCase().includes(text));
  const rows: PickerRow[] = [...startsWith, ...contains].map(genre => ({ kind: "genre", genre }));

  const exists = genres.some(genre => genre.name.toLowerCase() === text) || hasGenre(picked, text);
  if (!exists) rows.push({ kind: "create", name: query.trim() });
  return rows;
}

/** Splits a name around the first place the text appears, ignoring case, so the match can be shown in bold. */
export function splitMatch(name: string, query: string): { before: string; match: string; after: string } {
  const text = query.trim().toLowerCase();
  const start = text ? name.toLowerCase().indexOf(text) : -1;
  if (start === -1) return { before: name, match: "", after: "" };
  return { before: name.slice(0, start), match: name.slice(start, start + text.length), after: name.slice(start + text.length) };
}
