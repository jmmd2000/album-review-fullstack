import { desc, eq, ilike, asc, or, count, inArray, avg, sql } from "drizzle-orm";
import type { GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { albumArtists, bookmarkedAlbums, reviewedAlbums } from "@/db/schema";
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

  /**
   * The bookmarks to review next. Bookmarks by artists already reviewed come first, the highest average album score first.
   * The rest follow, newest bookmark first.
   */
  static async getUpNext(limit: number) {
    const artistAverages = db
      .select({ artistSpotifyID: albumArtists.artistSpotifyID, averageScore: avg(reviewedAlbums.finalScore).as("average_score") })
      .from(albumArtists)
      .innerJoin(reviewedAlbums, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID))
      .groupBy(albumArtists.artistSpotifyID)
      .as("artist_averages");

    const rows = await db
      .select({ album: bookmarkedAlbums })
      .from(bookmarkedAlbums)
      .leftJoin(artistAverages, eq(artistAverages.artistSpotifyID, bookmarkedAlbums.artistSpotifyID))
      .orderBy(sql`${artistAverages.averageScore} desc nulls last`, desc(bookmarkedAlbums.createdAt))
      .limit(limit);
    return rows.map(row => row.album);
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
