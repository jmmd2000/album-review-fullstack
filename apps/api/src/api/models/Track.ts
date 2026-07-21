import "dotenv/config";
import { count, eq, sql, asc } from "drizzle-orm";
import { reviewedTracks, trackArtists } from "@/db/schema";
import { db, type Executor } from "@/db/client";
import type { ReviewedTrack } from "@shared/types";

export class TrackModel {
  static async getTracksByAlbumID(albumID: string) {
    return db.select().from(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, albumID)).orderBy(asc(reviewedTracks.createdAt));
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

  static async updateTrackFeatures(spotifyID: string, features: { id: string; name: string }[], executor: Executor = db) {
    return executor.update(reviewedTracks).set({ features, updatedAt: new Date() }).where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async getTrackCount() {
    return db
      .select({ count: count() })
      .from(reviewedTracks)
      .then(r => r[0].count);
  }

  static async getTracksByArtist(artistID: string) {
    const rows = await db.select().from(reviewedTracks).innerJoin(trackArtists, eq(reviewedTracks.spotifyID, trackArtists.trackSpotifyID)).where(eq(trackArtists.artistSpotifyID, artistID));
    return rows.map(r => r.reviewed_tracks);
  }

  static async getTracksFeaturingArtist(artistID: string) {
    // Match tracks where features array contains the artist ID
    const filter = JSON.stringify([{ id: artistID }]);
    return db
      .select()
      .from(reviewedTracks)
      .where(sql`${reviewedTracks.features} @> ${filter}::jsonb`);
  }

  static async getAllTracks(): Promise<ReviewedTrack[]> {
    return db.select().from(reviewedTracks) as Promise<ReviewedTrack[]>;
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
