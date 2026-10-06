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

/**
 * Names the selection for a heading: "Albums in pop", "Albums in pop and r&b from the 2010s" or "Albums in 3 genres".
 * Empty when nothing is picked.
 */
export function nameSelection(genreNames: string[], decade: number | null): string {
  if (genreNames.length === 0 && decade === null) return "";

  let name = "Albums";
  if (genreNames.length === 1) name = `Albums in ${genreNames[0]}`;
  if (genreNames.length === 2) name = `Albums in ${genreNames[0]} and ${genreNames[1]}`;
  if (genreNames.length > 2) name = `Albums in ${genreNames.length} genres`;

  return decade !== null ? `${name} from the ${decade}s` : name;
}

/**
 * The five highest and five lowest scored items. The lowest list leaves out anything already
 * in the highest list, so a small selection shows fewer rows instead of the same ones twice.
 */
export function highsAndLows<T>(items: T[], scoreOf: (item: T) => number): { highest: T[]; lowest: T[] } {
  const highest = [...items].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 5);
  const lowest = [...items]
    .sort((a, b) => scoreOf(a) - scoreOf(b))
    .filter(item => !highest.includes(item))
    .slice(0, 5);
  return { highest, lowest };
}
