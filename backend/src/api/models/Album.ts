import "dotenv/config";
import { desc, eq, ilike, asc, or, count } from "drizzle-orm";
import { GetPaginatedAlbumsOptions } from "@shared/types";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "../../db/schema";
import { db } from "../../index";

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

    const baseQuery = db
      .select()
      .from(reviewedAlbums)
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET)
      .orderBy(sortDirection === "asc" ? asc(reviewedAlbums[sortField]) : desc(reviewedAlbums[sortField]));

    return search.trim() ? await baseQuery.where(or(ilike(reviewedAlbums.name, `%${search}%`), ilike(reviewedAlbums.artistName, `%${search}%`))) : await baseQuery;
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
}
