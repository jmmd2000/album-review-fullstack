import "dotenv/config";
import { count, eq } from "drizzle-orm";
import { reviewedTracks } from "@/db/schema";
import { db } from "@/index";
import { ReviewedTrack } from "@shared/types";

export class TrackModel {
  static async getTracksByAlbumID(albumID: string) {
    const tracks = await db
      .select()
      .from(reviewedTracks)
      .where(eq(reviewedTracks.albumSpotifyID, albumID));

    // Really random bug where sometimes these dont return in the correct order
    return tracks.sort(
      (a, b) => a.createdAt!.getTime() - b.createdAt!.getTime()
    );
  }

  static async deleteTracksByAlbumID(albumID: string) {
    return db
      .delete(reviewedTracks)
      .where(eq(reviewedTracks.albumSpotifyID, albumID));
  }

  static async createTrack(values: typeof reviewedTracks.$inferInsert) {
    return db
      .insert(reviewedTracks)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async updateTrackRating(spotifyID: string, rating: number) {
    return db
      .update(reviewedTracks)
      .set({ rating, updatedAt: new Date() })
      .where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async getTrackCount() {
    return db
      .select({ count: count() })
      .from(reviewedTracks)
      .then(r => r[0].count);
  }

  static async getTracksByArtist(artistID: string) {
    return db
      .select()
      .from(reviewedTracks)
      .where(eq(reviewedTracks.artistSpotifyID, artistID));
  }

  static async getAllTracks(): Promise<ReviewedTrack[]> {
    return db.select().from(reviewedTracks) as Promise<ReviewedTrack[]>;
  }
}
