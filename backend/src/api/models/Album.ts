import "dotenv/config";
import { desc, eq, ilike, asc, or, count, inArray } from "drizzle-orm";
import { GetPaginatedAlbumsOptions } from "@shared/types";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "@/db/schema";
import { db } from "@/index";

export class AlbumModel {
  static async findBySpotifyID(id: string) {
    return db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, id))
      .then((r) => r[0]);
  }

  static async createAlbum(values: typeof reviewedAlbums.$inferInsert) {
    return db
      .insert(reviewedAlbums)
      .values(values)
      .returning()
      .then((r) => r[0]);
  }

  static async updateAlbum(spotifyID: string, values: Partial<typeof reviewedAlbums.$inferInsert>) {
    return db.update(reviewedAlbums).set(values).where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async deleteAlbum(spotifyID: string) {
    return db.delete(reviewedAlbums).where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async getAllAlbums() {
    return db.select().from(reviewedAlbums);
  }

  static async getPaginatedAlbums({ page = 1, orderBy = "createdAt", order = "desc", search = "" }: GetPaginatedAlbumsOptions) {
    const validOrderBy = ["reviewScore", "releaseYear", "name", "createdAt"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "reviewScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const PAGE_SIZE = 35;
    const OFFSET = (page - 1) * PAGE_SIZE;

    // The previous way of building the query meant there would be a duplicated entry
    // at the end of the 1st page which also would appear on the start of the second page
    // (seemingly only when sorting by reviewScore ascending). Here we sort first by the selected
    // field e.g. reviewScore and then alphabetically by album name to break ties, therefore preventing duplicate entries.
    const baseOrder = sortDirection === "asc" ? [asc(reviewedAlbums[sortField]), asc(reviewedAlbums.name)] : [desc(reviewedAlbums[sortField]), desc(reviewedAlbums.name)];

    const albums = search.trim()
      ? await db
          .select()
          .from(reviewedAlbums)
          .where(or(ilike(reviewedAlbums.name, `%${search}%`), ilike(reviewedAlbums.artistName, `%${search}%`)))
          .orderBy(...baseOrder)
          .limit(PAGE_SIZE)
          .offset(OFFSET)
      : await db
          .select()
          .from(reviewedAlbums)
          .orderBy(...baseOrder)
          .limit(PAGE_SIZE)
          .offset(OFFSET);

    const [{ count: totalCount }] = await db.select({ count: count() }).from(reviewedAlbums);

    const furtherPages = OFFSET + PAGE_SIZE < totalCount;

    return {
      albums,
      furtherPages,
      totalCount,
    };
  }

  static async getAlbumCount() {
    return db
      .select({ count: count() })
      .from(reviewedAlbums)
      .then((r) => r[0].count);
  }

  static async getAlbumsByArtist(spotifyID: string) {
    return db.select().from(reviewedAlbums).where(eq(reviewedAlbums.artistSpotifyID, spotifyID));
  }

  static async getReviewScoresByIds(ids: string[]): Promise<{ spotifyID: string; reviewScore: number }[]> {
    const rows = await db
      .select({
        spotifyID: reviewedAlbums.spotifyID,
        reviewScore: reviewedAlbums.reviewScore,
      })
      .from(reviewedAlbums)
      .where(inArray(reviewedAlbums.spotifyID, ids));

    return rows.map((r) => ({
      spotifyID: r.spotifyID,
      reviewScore: r.reviewScore,
    }));
  }
}
