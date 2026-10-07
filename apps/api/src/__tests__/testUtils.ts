import { assertTestDatabase } from "@/db/databaseSafety";

/**
 * Truncates every table in the test database. Refuses to run unless tests are running against a local test database.
 *
 * @param query - A parameterised query runner bound to the test database pool.
 * @throws If NODE_ENV is not "test", DATABASE_URL_TEST is not set, or it isn't a local test database.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resetTables = async (query: (text: string, params?: any[]) => Promise<any>) => {
  // Each worker's copy shares the base test database's name, so checking DATABASE_URL_TEST covers it
  assertTestDatabase(process.env.DATABASE_URL_TEST);

  await query("TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists, album_artists, track_artists, bookmarked_albums, genres, album_genres, related_genres, settings RESTART IDENTITY CASCADE;");
};
