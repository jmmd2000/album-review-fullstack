import "dotenv/config";
import { asc, count, eq, gt, sql } from "drizzle-orm";
import { reviewedTracks, trackArtists } from "@/db/schema";
import { db, type Executor } from "@/db/client";
import type { TrackPick } from "@shared/types";

export class TrackModel {
  /**
   * The album's tracks in album order. A review saves its tracks in album order, so the IDs follow it.
   * The created times can't: tracks saved in one transaction all get the same time.
   */
  static async getTracksByAlbumID(albumID: string) {
    return db.select().from(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, albumID)).orderBy(asc(reviewedTracks.id));
  }

  static async deleteTracksByAlbumID(albumID: string, executor: Executor = db) {
    return executor.delete(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, albumID));
  }

  static async createTrack(values: typeof reviewedTracks.$inferInsert, executor: Executor = db) {
    return executor
      .insert(reviewedTracks)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async updateTrackRating(spotifyID: string, rating: number, executor: Executor = db) {
    return executor.update(reviewedTracks).set({ rating, updatedAt: new Date() }).where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async updateTrackPick(spotifyID: string, pick: TrackPick | null, executor: Executor = db) {
    return executor.update(reviewedTracks).set({ pick, updatedAt: new Date() }).where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async updateTrackFeatures(spotifyID: string, features: { id: string; name: string }[], executor: Executor = db) {
    return executor.update(reviewedTracks).set({ features, updatedAt: new Date() }).where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async getRatedTrackCount() {
    return db
      .select({ count: count() })
      .from(reviewedTracks)
      .where(gt(reviewedTracks.rating, 0))
      .then(r => r[0].count);
  }

  /** The artist's tracks, each album's tracks in album order. The albums come in the order they were reviewed. */
  static async getTracksByArtist(artistID: string) {
    const rows = await db
      .select()
      .from(reviewedTracks)
      .innerJoin(trackArtists, eq(reviewedTracks.spotifyID, trackArtists.trackSpotifyID))
      .where(eq(trackArtists.artistSpotifyID, artistID))
      .orderBy(asc(reviewedTracks.id));
    return rows.map(r => r.reviewed_tracks);
  }

  static async getTracksFeaturingArtist(artistID: string) {
    const filter = JSON.stringify([{ id: artistID }]);
    return db
      .select()
      .from(reviewedTracks)
      .where(sql`${reviewedTracks.features} @> ${filter}::jsonb`);
  }

  static async linkArtistsToTrack(trackSpotifyID: string, artistIDs: string[], executor: Executor = db) {
    if (artistIDs.length === 0) return;
    return executor
      .insert(trackArtists)
      .values(
        artistIDs.map(artistSpotifyID => ({
          trackSpotifyID,
          artistSpotifyID,
        }))
      )
      .onConflictDoNothing({
        target: [trackArtists.trackSpotifyID, trackArtists.artistSpotifyID],
      });
  }

  static async unlinkArtistsFromTrack(trackSpotifyID: string, executor: Executor = db) {
    return executor.delete(trackArtists).where(eq(trackArtists.trackSpotifyID, trackSpotifyID));
  }
}
