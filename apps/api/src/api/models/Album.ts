import { desc, eq, asc, count, inArray, sql, and, isNull, ilike, or } from "drizzle-orm";
import type { DisplayAlbum, GetPaginatedAlbumsOptions, ReviewedAlbum } from "@shared/types";
import { albumGenres, albumArtists, genres as genresTable, reviewedAlbums, reviewedTracks, trackArtists } from "@/db/schema";
import { db, type Executor } from "@/db/client";
import { PAGE_SIZE } from "@/config/constants";

export class AlbumModel {
  static async findBySpotifyID(id: string) {
    return db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, id))
      .then(r => r[0]);
  }

  static async createAlbum(values: typeof reviewedAlbums.$inferInsert, executor: Executor = db) {
    return executor
      .insert(reviewedAlbums)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async updateAlbum(spotifyID: string, values: Partial<typeof reviewedAlbums.$inferInsert>, executor: Executor = db) {
    return executor
      .update(reviewedAlbums)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async deleteAlbum(spotifyID: string, executor: Executor = db) {
    return executor.delete(reviewedAlbums).where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async getAllAlbums(): Promise<ReviewedAlbum[]> {
    return db.select().from(reviewedAlbums);
  }

  /** Up to `limit` reviewed albums, in a random order. */
  static async getRandomAlbums(limit: number): Promise<ReviewedAlbum[]> {
    return db
      .select()
      .from(reviewedAlbums)
      .orderBy(sql`random()`)
      .limit(limit);
  }

  /** The Spotify ID of the newest review, or null when there are none. */
  static async getLatestAlbumID(): Promise<string | null> {
    const [latest] = await db.select({ spotifyID: reviewedAlbums.spotifyID }).from(reviewedAlbums).orderBy(desc(reviewedAlbums.createdAt)).limit(1);
    return latest?.spotifyID ?? null;
  }

  /** Albums whose name or artist contains the query. Names that start with it come first, then the highest scores. */
  static async searchAlbums(query: string, limit: number): Promise<ReviewedAlbum[]> {
    return db
      .select()
      .from(reviewedAlbums)
      .where(or(ilike(reviewedAlbums.name, `%${query}%`), ilike(reviewedAlbums.artistName, `%${query}%`)))
      .orderBy(desc(ilike(reviewedAlbums.name, `${query}%`)), desc(reviewedAlbums.finalScore))
      .limit(limit);
  }

  static async getAlbumsBySpotifyIDs(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(reviewedAlbums).where(inArray(reviewedAlbums.spotifyID, ids));
  }

  static async getPaginatedAlbums({ page = 1, orderBy = "createdAt", order = "desc", search = "", genres, secondaryOrderBy, secondaryOrder }: GetPaginatedAlbumsOptions) {
    const validOrder = ["asc", "desc"] as const;
    const OFFSET = (page - 1) * PAGE_SIZE;

    // If requested genres, look up the matching album IDs
    let albumIDs: string[] | undefined;
    if (genres?.length) {
      albumIDs = await this.getAlbumIdsByGenres(genres);
      // nothing matched, early return empty result
      if (albumIDs.length === 0) {
        return { albums: [], totalCount: 0, furtherPages: false };
      }
    }

    // Combine the genre and search filters into a single WHERE.
    const genreFilter = albumIDs ? inArray(reviewedAlbums.spotifyID, albumIDs) : undefined;
    const searchFilter = search.trim() ? sql`(reviewed_albums.name ILIKE ${`%${search.trim()}%`} OR reviewed_albums.artist_name ILIKE ${`%${search.trim()}%`})` : undefined;

    let baseOrder;
    if (orderBy === "releaseYear") {
      // When sorting by year, always use a secondary sort (default to finalScore if not provided)
      const validSecondaryOrderBy = ["finalScore", "name", "createdAt"] as const;
      const secondaryField = validSecondaryOrderBy.includes(secondaryOrderBy || "finalScore") ? secondaryOrderBy || "finalScore" : "finalScore";
      const secondaryDirection = validOrder.includes(secondaryOrder || "desc") ? secondaryOrder || "desc" : "desc";

      if (order === "asc") {
        baseOrder = [asc(reviewedAlbums[orderBy]), secondaryDirection === "asc" ? asc(reviewedAlbums[secondaryField]) : desc(reviewedAlbums[secondaryField])];
      } else {
        baseOrder = [desc(reviewedAlbums[orderBy]), secondaryDirection === "asc" ? asc(reviewedAlbums[secondaryField]) : desc(reviewedAlbums[secondaryField])];
      }
    } else {
      // Default sorting behavior
      baseOrder = order === "asc" ? [asc(reviewedAlbums[orderBy]), asc(reviewedAlbums.name)] : [desc(reviewedAlbums[orderBy]), desc(reviewedAlbums.name)];
    }

    const albums: DisplayAlbum[] = await db
      .select()
      .from(reviewedAlbums)
      .where(and(genreFilter, searchFilter))
      .orderBy(...baseOrder)
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET);

    const furtherPages = albums.length > PAGE_SIZE;
    if (furtherPages) albums.pop();

    const [{ count: totalCount }] = await db.select({ count: count() }).from(reviewedAlbums).where(and(genreFilter, searchFilter));

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
      .then(r => r[0].count);
  }

  static async getAlbumsByArtist(spotifyID: string) {
    const rows = await db.select().from(reviewedAlbums).innerJoin(albumArtists, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID)).where(eq(albumArtists.artistSpotifyID, spotifyID));
    return rows.map(r => r.reviewed_albums);
  }

  static async getAlbumsByArtistWithAffects(spotifyID: string) {
    // Include per-artist score attribution from the join table
    return db
      .select({
        album: reviewedAlbums,
        affectsScore: albumArtists.affectsScore,
      })
      .from(reviewedAlbums)
      .innerJoin(albumArtists, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID))
      .where(eq(albumArtists.artistSpotifyID, spotifyID));
  }

  static async getAlbumsByArtistsWithAffects(artistSpotifyIDs: string[], executor: Executor = db) {
    if (artistSpotifyIDs.length === 0) return new Map<string, { album: typeof reviewedAlbums.$inferSelect; affectsScore: boolean }[]>();

    const rows = await executor
      .select({
        album: reviewedAlbums,
        affectsScore: albumArtists.affectsScore,
        artistSpotifyID: albumArtists.artistSpotifyID,
      })
      .from(reviewedAlbums)
      .innerJoin(albumArtists, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID))
      .where(inArray(albumArtists.artistSpotifyID, artistSpotifyIDs));

    const map = new Map<string, { album: typeof reviewedAlbums.$inferSelect; affectsScore: boolean }[]>();
    for (const row of rows) {
      const existing = map.get(row.artistSpotifyID) ?? [];
      existing.push({ album: row.album, affectsScore: row.affectsScore });
      map.set(row.artistSpotifyID, existing);
    }
    return map;
  }

  static async getFeaturedAlbumIDsByArtist(artistID: string) {
    const rows = await db
      .select({ albumSpotifyID: reviewedTracks.albumSpotifyID })
      .from(reviewedTracks)
      .innerJoin(trackArtists, eq(reviewedTracks.spotifyID, trackArtists.trackSpotifyID))
      .leftJoin(albumArtists, and(eq(albumArtists.albumSpotifyID, reviewedTracks.albumSpotifyID), eq(albumArtists.artistSpotifyID, artistID)))
      .where(and(eq(trackArtists.artistSpotifyID, artistID), isNull(albumArtists.artistSpotifyID)))
      .groupBy(reviewedTracks.albumSpotifyID);

    return rows.map(r => r.albumSpotifyID);
  }

  static async getAlbumArtistIDs(albumSpotifyID: string): Promise<string[]> {
    const rows = await db.select({ artistSpotifyID: albumArtists.artistSpotifyID }).from(albumArtists).where(eq(albumArtists.albumSpotifyID, albumSpotifyID));
    return rows.map(r => r.artistSpotifyID);
  }

  static async getAlbumArtistLinks(albumSpotifyID: string) {
    return db
      .select({
        artistSpotifyID: albumArtists.artistSpotifyID,
        affectsScore: albumArtists.affectsScore,
      })
      .from(albumArtists)
      .where(eq(albumArtists.albumSpotifyID, albumSpotifyID));
  }

  static async getAlbumArtistIDsForAlbums(albumIDs: string[]) {
    if (albumIDs.length === 0) return new Map<string, string[]>();
    const rows = await db
      .select({
        albumSpotifyID: albumArtists.albumSpotifyID,
        artistSpotifyID: albumArtists.artistSpotifyID,
      })
      .from(albumArtists)
      .where(inArray(albumArtists.albumSpotifyID, albumIDs));

    const map = new Map<string, string[]>();
    for (const row of rows) {
      const current = map.get(row.albumSpotifyID) ?? [];
      current.push(row.artistSpotifyID);
      map.set(row.albumSpotifyID, current);
    }
    return map;
  }

  static async upsertAlbumArtists(albumSpotifyID: string, entries: { artistSpotifyID: string; affectsScore: boolean }[], executor: Executor = db) {
    if (entries.length === 0) return;
    return executor
      .insert(albumArtists)
      .values(
        entries.map(entry => ({
          albumSpotifyID,
          artistSpotifyID: entry.artistSpotifyID,
          affectsScore: entry.affectsScore,
        }))
      )
      .onConflictDoUpdate({
        target: [albumArtists.albumSpotifyID, albumArtists.artistSpotifyID],
        set: { affectsScore: sql`excluded.affects_score` },
      });
  }

  static async unlinkArtistsFromAlbum(albumSpotifyID: string, artistIDs: string[], executor: Executor = db) {
    if (artistIDs.length === 0) return;
    return executor.delete(albumArtists).where(and(eq(albumArtists.albumSpotifyID, albumSpotifyID), inArray(albumArtists.artistSpotifyID, artistIDs)));
  }

  /** The final scores of the reviewed albums among `ids`. Albums without a review are left out. */
  static async getFinalScoresByIds(ids: string[]): Promise<{ spotifyID: string; finalScore: number }[]> {
    return db
      .select({
        spotifyID: reviewedAlbums.spotifyID,
        finalScore: reviewedAlbums.finalScore,
      })
      .from(reviewedAlbums)
      .where(inArray(reviewedAlbums.spotifyID, ids));
  }

  private static async getAlbumIdsByGenres(slugs: string[]): Promise<string[]> {
    if (!slugs.length) return [];

    // An album matches when it has any of the slugs. Grouping lists an album with two of them once.
    const rows = await db
      .select({ id: albumGenres.albumSpotifyID })
      .from(albumGenres)
      .innerJoin(genresTable, eq(genresTable.id, albumGenres.genreID))
      .where(inArray(genresTable.slug, slugs))
      .groupBy(albumGenres.albumSpotifyID);

    return rows.map(r => r.id);
  }
}
