import { db } from "../index";
import { reviewedAlbums } from "../db/schema";

/**
 * Fetches all unique genres from the reviewedAlbums table.
 */
export async function getAllGenres(): Promise<string[]> {
  // Fetch all genre arrays from the table
  const rows = await db.select({ genres: reviewedAlbums.genres }).from(reviewedAlbums);

  // Flatten, dedupe, filter falsy, and sort
  const allGenres = rows
    .flatMap((row) => row.genres || [])
    .filter((g): g is string => typeof g === "string" && g.trim() !== "")
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));

  return allGenres;
}
