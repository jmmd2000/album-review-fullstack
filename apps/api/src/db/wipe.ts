import "@/config/loadEnvironment";
import { resolveDatabaseURL } from "@/config/database";
import { query, closeDatabase } from "@/db/client";
import { assertSafeToWipe } from "@/db/databaseSafety";

// Wipes the review data straight through the database. Settings are left alone.
const wipe = async () => {
  assertSafeToWipe(resolveDatabaseURL());

  await query("TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists, album_artists, track_artists, bookmarked_albums, genres, album_genres, related_genres RESTART IDENTITY CASCADE;");
  console.log("Wipe: review data cleared.");
  await closeDatabase();
};

wipe();
