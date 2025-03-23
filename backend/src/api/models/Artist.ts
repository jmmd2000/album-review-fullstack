import "dotenv/config";
import { count, desc, eq } from "drizzle-orm";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "../../db/schema";
import { db } from "../../index";
import { ReviewedAlbum, ReviewedArtist } from "@shared/types";

export class ArtistModel {
  static async getAllArtists() {
    return db.select().from(reviewedArtists);
  }

  static async getArtistBySpotifyID(artistID: string) {
    return db
      .select()
      .from(reviewedArtists)
      .where(eq(reviewedArtists.spotifyID, artistID))
      .then((r) => r[0]);
  }

  static async deleteArtist(artistID: string) {
    return db.delete(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID));
  }

  static async createArtist(values: typeof reviewedArtists.$inferInsert) {
    return db
      .insert(reviewedArtists)
      .values(values)
      .returning()
      .then((r) => r[0]);
  }

  static async updateArtist(spotifyID: string, values: Partial<typeof reviewedArtists.$inferInsert>) {
    return db.update(reviewedArtists).set(values).where(eq(reviewedArtists.spotifyID, spotifyID));
  }

  static async getArtistCount() {
    return db
      .select({ count: count() })
      .from(reviewedArtists)
      .then((r) => r[0].count);
  }

  static async findAllArtistsSortedByTotalScore() {
    return db.select().from(reviewedArtists).orderBy(desc(reviewedArtists.totalScore));
  }

  static async updateLeaderboardPosition(id: number, position: number) {
    return db.update(reviewedArtists).set({ leaderboardPosition: position }).where(eq(reviewedArtists.id, id));
  }
}
