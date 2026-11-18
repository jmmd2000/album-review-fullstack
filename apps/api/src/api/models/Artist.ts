import { desc, eq, ilike, asc, count, inArray } from "drizzle-orm";
import { reviewedArtists } from "@/db/schema";
import { db, type Executor } from "@/db/client";
import type { GetPaginatedArtistsOptions, ReviewedArtist } from "@shared/types";
import { PAGE_SIZE } from "@/config/constants";

export class ArtistModel {
  static async getAllArtists(executor: Executor = db): Promise<ReviewedArtist[]> {
    return executor.select().from(reviewedArtists);
  }

  static async getPaginatedArtists({ page = 1, orderBy = "totalScore", order = "desc", search = "" }: GetPaginatedArtistsOptions) {
    const validOrderBy = ["totalScore", "peakScore", "latestScore", "reviewCount", "name", "createdAt", "leaderboardPosition"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "totalScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const OFFSET = (page - 1) * PAGE_SIZE;
    const searchFilter = search.trim() ? ilike(reviewedArtists.name, `%${search}%`) : undefined;
    const sortOrder = sortDirection === "asc" ? asc(reviewedArtists[sortField]) : desc(reviewedArtists[sortField]);

    // Postgres gives tied rows no fixed order, so ties break on name and then ID to keep pages stable
    const artists = await db
      .select()
      .from(reviewedArtists)
      .where(searchFilter)
      .orderBy(sortOrder, asc(reviewedArtists.name), asc(reviewedArtists.id))
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET);

    const [{ count: totalCount }] = await db.select({ count: count() }).from(reviewedArtists).where(searchFilter);

    return { artists, totalCount };
  }

  /** Artists whose name contains the query. Names that start with it come first, then the highest scores. */
  static async searchArtists(query: string, limit: number): Promise<ReviewedArtist[]> {
    return db
      .select()
      .from(reviewedArtists)
      .where(ilike(reviewedArtists.name, `%${query}%`))
      .orderBy(desc(ilike(reviewedArtists.name, `${query}%`)), desc(reviewedArtists.totalScore))
      .limit(limit);
  }

  static async getArtistBySpotifyID(artistID: string) {
    return db
      .select()
      .from(reviewedArtists)
      .where(eq(reviewedArtists.spotifyID, artistID))
      .then(r => r[0]);
  }

  static async getArtistsBySpotifyIDs(ids: string[], executor: Executor = db) {
    if (ids.length === 0) return [];
    return executor.select().from(reviewedArtists).where(inArray(reviewedArtists.spotifyID, ids));
  }

  static async deleteArtist(artistID: string, executor: Executor = db) {
    return executor.delete(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID));
  }

  static async createArtist(values: typeof reviewedArtists.$inferInsert, executor: Executor = db) {
    return executor
      .insert(reviewedArtists)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async updateArtist(spotifyID: string, values: Partial<typeof reviewedArtists.$inferInsert>, executor: Executor = db) {
    return executor
      .update(reviewedArtists)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(reviewedArtists.spotifyID, spotifyID));
  }

  static async getArtistCount() {
    return db
      .select({ count: count() })
      .from(reviewedArtists)
      .then(r => r[0].count);
  }

  /** The number of artists with a leaderboard position. Unrated artists have none. */
  static async getRankedArtistCount() {
    return db
      .select({ count: count() })
      .from(reviewedArtists)
      .where(eq(reviewedArtists.unrated, false))
      .then(r => r[0].count);
  }

  static async findAllArtistsSortedByTotalScore() {
    return db.select().from(reviewedArtists).orderBy(desc(reviewedArtists.totalScore));
  }

  static async updateLeaderboardPosition(id: number, position: number | null, executor: Executor = db) {
    return executor.update(reviewedArtists).set({ leaderboardPosition: position }).where(eq(reviewedArtists.id, id));
  }

  static async updatePeakLeaderboardPosition(id: number, position: number | null, executor: Executor = db) {
    return executor.update(reviewedArtists).set({ peakLeaderboardPosition: position }).where(eq(reviewedArtists.id, id));
  }

  static async updateLatestLeaderboardPosition(id: number, position: number | null, executor: Executor = db) {
    return executor.update(reviewedArtists).set({ latestLeaderboardPosition: position }).where(eq(reviewedArtists.id, id));
  }
}
