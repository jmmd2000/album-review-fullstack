const DAY_MS = 24 * 60 * 60 * 1000;
/** How far back an album counts as new */
export const NEW_ALBUM_WINDOW_DAYS = 90;
/** Words in an album name that mark a live album, a reissue, a soundtrack or a remix album */
const NOT_A_NEW_STUDIO_ALBUM = /\b(live|deluxe|anniversary|remaster(ed)?|expanded|reissue|edition|soundtrack|original score|ost|remix(es)?)\b/i;

/** Tells whether an album's name marks it as a live album, a reissue, a soundtrack or a remix album. */
export function isLiveReissueOrSoundtrack(name: string): boolean {
  return NOT_A_NEW_STUDIO_ALBUM.test(name);
}

/**
 * Reads a Spotify release date, which can be a year ("2024"), a month ("2024-06") or a day ("2024-06-07").
 * A year or a month without a day counts as its first day.
 */
export function parseReleaseDate(releaseDate: string): Date {
  const [year, month = "01", day = "01"] = releaseDate.split("-");
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

/**
 * Tells whether an album is a new studio album: released in the last 90 days, already out,
 * and not a live album, a reissue, a soundtrack or a remix album by its name.
 */
export function isNewStudioAlbum(album: { name: string; releaseDate: string }, now: Date): boolean {
  const released = parseReleaseDate(album.releaseDate).getTime();
  if (released > now.getTime()) return false;
  if (now.getTime() - released > NEW_ALBUM_WINDOW_DAYS * DAY_MS) return false;
  return !isLiveReissueOrSoundtrack(album.name);
}
