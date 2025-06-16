import "dotenv/config";
import { desc, eq, ilike, asc, or, count, inArray, exists, sql } from "drizzle-orm";
import { DisplayAlbum, GetPaginatedAlbumsOptions } from "@shared/types";
import { albumGenres, genres as genresTable, reviewedAlbums, reviewedArtists, reviewedTracks } from "@/db/schema";
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
    return db
      .update(reviewedAlbums)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async deleteAlbum(spotifyID: string) {
    return db.delete(reviewedAlbums).where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async getAllAlbums() {
    return db.select().from(reviewedAlbums);
  }

  static async getPaginatedAlbums({ page = 1, orderBy = "createdAt", order = "desc", search = "", genres }: GetPaginatedAlbumsOptions) {
    const validOrderBy = ["finalScore", "releaseYear", "name", "createdAt"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "finalScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const PAGE_SIZE = 35;
    const OFFSET = (page - 1) * PAGE_SIZE;

    // A) if the caller asked for genres, look up the matching album IDs
    let albumIds: string[] | undefined;
    if (genres?.length) {
      albumIds = await this.getAlbumIdsByGenres(genres);
      // nothing matched → short‐circuit
      if (albumIds.length === 0) {
        return { albums: [], totalCount: 0, furtherPages: false };
      }
    }

    // B) build your exact same paging query, + one extra WHERE if albumIds is set
    let q: any = db
      .select()
      .from(reviewedAlbums)
      .where(albumIds ? inArray(reviewedAlbums.spotifyID, albumIds) : undefined);

    if (search.trim()) {
      q = q.where(
        // you can chain .where() calls
        sql`(reviewed_albums.name ILIKE ${`%${search.trim()}%`} 
           OR reviewed_albums.artist_name ILIKE ${`%${search.trim()}%`})`
      );
    }

    const baseOrder = order === "asc" ? [asc(reviewedAlbums[orderBy]), asc(reviewedAlbums.name)] : [desc(reviewedAlbums[orderBy]), desc(reviewedAlbums.name)];

    const albums: DisplayAlbum[] = await q
      .orderBy(...baseOrder)
      .limit(PAGE_SIZE)
      .offset(OFFSET);

    // C) count with the same IN‐filter
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(reviewedAlbums)
      .where(albumIds ? inArray(reviewedAlbums.spotifyID, albumIds) : undefined);

    const furtherPages = OFFSET + PAGE_SIZE < Number(totalCount);

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

  private static async getAlbumIdsByGenres(slugs: string[]): Promise<string[]> {
    if (!slugs.length) return [];

    // 1) join album_genres → genres, filter slug IN slugs
    // 2) group by album, require COUNT(*) = slugs.length so we only get albums that matched every slug
    const rows = await db
      .select({ id: albumGenres.albumSpotifyID })
      .from(albumGenres)
      .innerJoin(genresTable, eq(genresTable.id, albumGenres.genreID))
      .where(inArray(genresTable.slug, slugs))
      .groupBy(albumGenres.albumSpotifyID)
      .having(sql`COUNT(*) = ${slugs.length}`);

    return rows.map((r) => r.id);
  }
}
