import "dotenv/config";
import { desc, eq, ilike, asc, or, count } from "drizzle-orm";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "@/db/schema";
import { db } from "@/index";
import { GetPaginatedArtistsOptions, ReviewedAlbum, ReviewedArtist } from "@shared/types";

export class ArtistModel {
  static async getAllArtists() {
    return db.select().from(reviewedArtists);
  }

  static async getPaginatedArtists({ page = 1, orderBy = "createdAt", order = "desc", search = "" }: GetPaginatedArtistsOptions) {
    const validOrderBy = ["totalScore", "reviewCount", "name", "createdAt", "leaderboardPosition"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "totalScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const PAGE_SIZE = 35;
    const OFFSET = (page - 1) * PAGE_SIZE;

    const baseQuery = db
      .select()
      .from(reviewedArtists)
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET)
      .orderBy(sortDirection === "asc" ? asc(reviewedArtists[sortField]) : desc(reviewedArtists[sortField]));

    return search.trim() ? await baseQuery.where(ilike(reviewedArtists.name, `%${search}%`)) : await baseQuery;
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

  static async updateLeaderboardPosition(id: number, position: number | null) {
    return db.update(reviewedArtists).set({ leaderboardPosition: position }).where(eq(reviewedArtists.id, id));
  }
}
