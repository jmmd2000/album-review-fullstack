import "dotenv/config";
import { desc, eq, ilike, asc, or, count, inArray } from "drizzle-orm";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "@/db/schema";
import { db } from "@/index";
import { GetPaginatedArtistsOptions, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { PAGE_SIZE } from "@/config/constants";

export class ArtistModel {
  static async getAllArtists(): Promise<ReviewedArtist[]> {
    return db.select().from(reviewedArtists) as Promise<ReviewedArtist[]>;
  }

  static async getPaginatedArtists({
    page = 1,
    orderBy = "totalScore",
    order = "desc",
    search = "",
    scoreType = "overall",
  }: GetPaginatedArtistsOptions) {
    const validOrderBy = [
      "totalScore",
      "peakScore",
      "latestScore",
      "reviewCount",
      "name",
      "createdAt",
      "leaderboardPosition",
    ] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "totalScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const OFFSET = (page - 1) * PAGE_SIZE;

    // Determine which score field to use based on orderBy and scoreType
    let actualSortField = sortField;
    if (sortField === "totalScore") {
      if (scoreType === "peak") {
        actualSortField = "peakScore";
      } else if (scoreType === "latest") {
        actualSortField = "latestScore";
      }
      // For "overall", use totalScore as is
    }

    const baseQuery = db
      .select()
      .from(reviewedArtists)
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET)
      .orderBy(
        sortDirection === "asc"
          ? asc(reviewedArtists[actualSortField])
          : desc(reviewedArtists[actualSortField])
      );

    return search.trim()
      ? await baseQuery.where(ilike(reviewedArtists.name, `%${search}%`))
      : await baseQuery;
  }

  static async getArtistBySpotifyID(artistID: string) {
    return db
      .select()
      .from(reviewedArtists)
      .where(eq(reviewedArtists.spotifyID, artistID))
      .then(r => r[0]);
  }

  static async getArtistsBySpotifyIDs(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(reviewedArtists).where(inArray(reviewedArtists.spotifyID, ids));
  }

  static async deleteArtist(artistID: string) {
    return db.delete(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID));
  }

  static async createArtist(values: typeof reviewedArtists.$inferInsert) {
    return db
      .insert(reviewedArtists)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async updateArtist(
    spotifyID: string,
    values: Partial<typeof reviewedArtists.$inferInsert>
  ) {
    return db
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

  static async findAllArtistsSortedByTotalScore() {
    return db.select().from(reviewedArtists).orderBy(desc(reviewedArtists.totalScore));
  }

  static async updateLeaderboardPosition(id: number, position: number | null) {
    return db
      .update(reviewedArtists)
      .set({ leaderboardPosition: position })
      .where(eq(reviewedArtists.id, id));
  }

  static async updatePeakLeaderboardPosition(id: number, position: number | null) {
    return db
      .update(reviewedArtists)
      .set({ peakLeaderboardPosition: position })
      .where(eq(reviewedArtists.id, id));
  }

  static async updateLatestLeaderboardPosition(id: number, position: number | null) {
    return db
      .update(reviewedArtists)
      .set({ latestLeaderboardPosition: position })
      .where(eq(reviewedArtists.id, id));
  }
}
