import { Hono } from "hono";
import { query } from "@/db/client";

// Truncates the review-related tables to reset state between test runs.
// Dev/test only: mounted behind a NODE_ENV guard in app.ts.
const test = new Hono().delete("/reset", async c => {
  await query(`
    TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists,
    album_artists, track_artists, bookmarked_albums, album_genres
    RESTART IDENTITY CASCADE
  `);
  return c.json({ success: true, message: "Test data reset" });
});

export default test;
