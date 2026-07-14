/**
 * Truncates every table in the test database. Refuses to run unless the process is definitely in a test env.
 *
 * @param query - A parameterised query runner bound to the test database pool.
 * @throws If NODE_ENV is not "test", or DATABASE_URL_TEST is not set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resetTables = async (query: (text: string, params?: any[]) => Promise<any>) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(`resetTables refused to run: NODE_ENV is "${process.env.NODE_ENV ?? "undefined"}", expected "test"`);
  }
  if (!process.env.DATABASE_URL_TEST) {
    throw new Error("resetTables refused to run: DATABASE_URL_TEST is not set");
  }

  await query("TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists, album_artists, track_artists, bookmarked_albums, genres, album_genres, related_genres, settings RESTART IDENTITY CASCADE;");
};