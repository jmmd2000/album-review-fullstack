import "dotenv/config";
import { query, closeDatabase } from "@/db/client";

// Wipes the review data from whatever DATABASE_URL points at, straight through
// the database. Settings are left alone.
const wipe = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Wipe: refusing to run against a production environment");
  }

  await query("TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists, album_artists, track_artists, bookmarked_albums, genres, album_genres, related_genres RESTART IDENTITY CASCADE;");
  console.log("Wipe: review data cleared.");
  await closeDatabase();
};

wipe();
