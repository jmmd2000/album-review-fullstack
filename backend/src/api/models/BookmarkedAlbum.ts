import "dotenv/config";
import { desc, eq, ilike, asc, or, count, inArray } from "drizzle-orm";
import { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { bookmarkedAlbums } from "@/db/schema";
import { db } from "@/index";
import { PAGE_SIZE } from "@/config/constants";

export class BookmarkedAlbumModel {
  static async findBySpotifyID(id: string) {
    return db
      .select()
      .from(bookmarkedAlbums)
      .where(eq(bookmarkedAlbums.spotifyID, id))
      .then(r => r[0]);
  }

  static async getBookmarkedByIds(ids: string[]): Promise<string[]> {
    const rows = await db
      .select({ spotifyID: bookmarkedAlbums.spotifyID })
      .from(bookmarkedAlbums)
      .where(inArray(bookmarkedAlbums.spotifyID, ids));
    return rows.map(r => r.spotifyID);
  }

  static async bookmarkAlbum(values: typeof bookmarkedAlbums.$inferInsert) {
    return db
      .insert(bookmarkedAlbums)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async removeBookmarkedAlbum(spotifyID: string) {
    return db.delete(bookmarkedAlbums).where(eq(bookmarkedAlbums.spotifyID, spotifyID));
  }

  static async getAllBookmarkedAlbums() {
    return db.select().from(bookmarkedAlbums);
  }

  static async getPaginatedAlbums({
    page = 1,
    orderBy = "createdAt",
    order = "desc",
    search = "",
  }: GetPaginatedBookmarkedAlbumsOptions) {
    const validOrderBy = ["artistName", "releaseYear", "name", "createdAt"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "createdAt";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const OFFSET = (page - 1) * PAGE_SIZE;

    const baseQuery = db
      .select()
      .from(bookmarkedAlbums)
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET)
      .orderBy(
        sortDirection === "asc"
          ? asc(bookmarkedAlbums[sortField])
          : desc(bookmarkedAlbums[sortField])
      );

    return search.trim()
      ? await baseQuery.where(
          or(
            ilike(bookmarkedAlbums.name, `%${search}%`),
            ilike(bookmarkedAlbums.artistName, `%${search}%`)
          )
        )
      : await baseQuery;
  }

  static async getBookmarkedAlbumCount() {
    return db
      .select({ count: count() })
      .from(bookmarkedAlbums)
      .then(r => r[0].count);
  }
}
