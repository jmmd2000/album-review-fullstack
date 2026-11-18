import slugify from "slugify";

export interface GenreSuggestion {
  /** The existing genre's own name, or the MusicBrainz name for a new one */
  name: string;
  /** True when no genre in the list has this name, so adding it creates one */
  isNew: boolean;
}

// MusicBrainz names on the left, the names the genre list uses on the right, both as keys
const ALIASES: Record<string, string> = {
  "alternative-rock": "alt-rock",
  "alternative-pop": "alt-pop",
  "alternative-country": "alt-country",
  "rhythm-and-blues": "r-and-b",
  synthpop: "synth-pop",
};

/**
 * The form two genre names share when they mean the same thing: the slug the genre list uses,
 * with "&" read as "and". "Hip Hop", "hip-hop" and "hip  hop" are all "hip-hop", and "r&b" is "r-and-b".
 */
export function genreKey(name: string): string {
  return slugify(name.replace(/&/g, " and "), { lower: true, strict: true });
}

/**
 * Matches MusicBrainz genres, most voted first, to the genre list by key and the alias list. There is no
 * fuzzy matching, because the list has close names such as post-punk and post-rock.
 * @returns One suggestion per genre, in the same order, with repeats left out.
 */
export function matchGenres(musicBrainzNames: string[], genreNames: string[]): GenreSuggestion[] {
  const genresByKey = new Map(genreNames.map(name => [genreKey(name), name]));
  const seenKeys = new Set<string>();
  const suggestions: GenreSuggestion[] = [];

  for (const musicBrainzName of musicBrainzNames) {
    const key = genreKey(musicBrainzName);
    const existing = genresByKey.get(ALIASES[key] ?? key);
    const name = existing ?? musicBrainzName;
    if (seenKeys.has(genreKey(name))) continue;

    seenKeys.add(genreKey(name));
    suggestions.push({ name, isNew: existing === undefined });
  }
  return suggestions;
}
