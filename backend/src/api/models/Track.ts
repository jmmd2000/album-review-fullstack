import "dotenv/config";
import { count, eq, sql } from "drizzle-orm";
import { reviewedTracks, trackArtists } from "@/db/schema";
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

  static async updateTrackFeatures(
    spotifyID: string,
    features: { id: string; name: string }[]
  ) {
    return db
      .update(reviewedTracks)
      .set({ features, updatedAt: new Date() })
      .where(eq(reviewedTracks.spotifyID, spotifyID));
  }

  static async getTrackCount() {
    return db
      .select({ count: count() })
      .from(reviewedTracks)
      .then(r => r[0].count);
  }

  static async getTracksByArtist(artistID: string) {
    const rows = await db
      .select()
      .from(reviewedTracks)
      .innerJoin(
        trackArtists,
        eq(reviewedTracks.spotifyID, trackArtists.trackSpotifyID)
      )
      .where(eq(trackArtists.artistSpotifyID, artistID));
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

  static async linkArtistsToTrack(
    trackSpotifyID: string,
    artistIDs: string[]
  ) {
    if (artistIDs.length === 0) return;
    return db
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

  static async unlinkArtistsFromTrack(trackSpotifyID: string) {
    return db
      .delete(trackArtists)
      .where(eq(trackArtists.trackSpotifyID, trackSpotifyID));
  }
}
