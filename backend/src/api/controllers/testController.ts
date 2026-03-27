import { query } from "../../../db";
import type { Request, Response } from "express";

/**
 * Reset test data by truncating review-related tables
 * **DEV/TEST ONLY** — never exposed in production
 */
export const resetTestData = async (req: Request, res: Response) => {
  try {
    await query(`
      TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists,
      album_artists, track_artists, bookmarked_albums, album_genres
      RESTART IDENTITY CASCADE
    `);

    res.json({ success: true, message: "Test data reset" });
  } catch (error) {
    console.error("Error resetting test data:", error);
    res.status(500).json({ error: "Failed to reset test data" });
  }
};
