import "dotenv/config";
import { count, eq } from "drizzle-orm";
import { reviewedTracks } from "../../db/schema";
import { db } from "../../index";

export class TrackModel {
  static async getTracksByAlbumID(albumID: string) {
    return db.select().from(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, albumID));
  }

  static async deleteTracksByAlbumID(albumID: string) {
    return db.delete(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, albumID));
  }

  static async createTrack(values: typeof reviewedTracks.$inferInsert) {
    return db
      .insert(reviewedTracks)
      .values(values)
      .returning()
      .then((r) => r[0]);
  }

  static async updateTrackRating(spotifyID: string, rating: number) {
    return db.update(reviewedTracks).set({ rating }).where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async getTrackCount() {
    return db
      .select({ count: count() })
      .from(reviewedTracks)
      .then((r) => r[0].count);
  }
}
