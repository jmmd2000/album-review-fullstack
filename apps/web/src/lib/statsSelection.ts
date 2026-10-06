export interface StatsFilter {
  /** The picked genre slugs. Albums in any of them match. */
  genres: string[];
  /** The first year of the picked decade, such as 2010, or null for every decade */
  decade: number | null;
}

interface FilterableAlbum {
  genres: string[];
  releaseYear: number;
}

/** 2017 becomes 2010. */
export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function isFiltered(filter: StatsFilter): boolean {
  return filter.genres.length > 0 || filter.decade !== null;
}

export function albumMatches(album: FilterableAlbum, filter: StatsFilter): boolean {
  if (filter.genres.length > 0 && !album.genres.some(genre => filter.genres.includes(genre))) return false;
  if (filter.decade !== null && decadeOf(album.releaseYear) !== filter.decade) return false;
  return true;
}

/**
 * Names the selected albums in a few words: "All 200 albums", "17 indie rock albums from the 2020s",
 * "4 pop and r&b albums" or "9 albums in 3 genres".
 *
 * @param genreNames The names of the picked genres
 */
export function describeSelection(count: number, genreNames: string[], decade: number | null): string {
  const albums = count === 1 ? "album" : "albums";
  let what = albums;
  if (genreNames.length === 1) what = `${genreNames[0]} ${albums}`;
  if (genreNames.length === 2) what = `${genreNames[0]} and ${genreNames[1]} ${albums}`;
  if (genreNames.length > 2) what = `${albums} in ${genreNames.length} genres`;

  const when = decade !== null ? ` from the ${decade}s` : "";
  const all = genreNames.length === 0 && decade === null ? "All " : "";
  return `${all}${count} ${what}${when}`;
}
