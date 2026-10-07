import "dotenv/config";
import { desc, eq, ilike, asc, or, count, inArray } from "drizzle-orm";
import type { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { bookmarkedAlbums } from "@/db/schema";
import { db, type Executor } from "@/db/client";
import { PAGE_SIZE } from "@/config/constants";

/** Matches bookmarks whose album or artist name contains the search. An empty search matches every bookmark. */
function searchFilter(search: string) {
  if (!search.trim()) return undefined;
  return or(ilike(bookmarkedAlbums.name, `%${search}%`), ilike(bookmarkedAlbums.artistName, `%${search}%`));
}

export class BookmarkedAlbumModel {
  static async findBySpotifyID(id: string) {
    return db
      .select()
      .from(bookmarkedAlbums)
      .where(eq(bookmarkedAlbums.spotifyID, id))
      .then(r => r[0]);
  }

  static async getBookmarkedByIds(ids: string[]): Promise<string[]> {
    const rows = await db.select({ spotifyID: bookmarkedAlbums.spotifyID }).from(bookmarkedAlbums).where(inArray(bookmarkedAlbums.spotifyID, ids));
    return rows.map(r => r.spotifyID);
  }

  static async bookmarkAlbum(values: typeof bookmarkedAlbums.$inferInsert) {
    return db
      .insert(bookmarkedAlbums)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async removeBookmarkedAlbum(spotifyID: string, executor: Executor = db) {
    return executor.delete(bookmarkedAlbums).where(eq(bookmarkedAlbums.spotifyID, spotifyID));
  }

  static async getAllBookmarkedAlbums() {
    return db.select().from(bookmarkedAlbums);
  }

  static async getPaginatedAlbums({ page = 1, orderBy = "createdAt", order = "desc", search = "" }: GetPaginatedBookmarkedAlbumsOptions) {
    const validOrderBy = ["artistName", "releaseYear", "name", "createdAt"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "createdAt";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const OFFSET = (page - 1) * PAGE_SIZE;

    return db
      .select()
      .from(bookmarkedAlbums)
      .where(searchFilter(search))
      .orderBy(sortDirection === "asc" ? asc(bookmarkedAlbums[sortField]) : desc(bookmarkedAlbums[sortField]))
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET);
  }

  /** The number of bookmarks that match the search, or of all bookmarks when it is empty. */
  static async getBookmarkedAlbumCount(search = "") {
    return db
      .select({ count: count() })
      .from(bookmarkedAlbums)
      .where(searchFilter(search))
      .then(r => r[0].count);
  }
}
