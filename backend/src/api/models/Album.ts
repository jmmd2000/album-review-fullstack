import "dotenv/config";
import {
  desc,
  eq,
  ilike,
  asc,
  or,
  count,
  inArray,
  exists,
  sql,
  and,
  isNull,
} from "drizzle-orm";
import { DisplayAlbum, GetPaginatedAlbumsOptions, ReviewedAlbum } from "@shared/types";
import {
  albumGenres,
  albumArtists,
  genres as genresTable,
  reviewedAlbums,
  reviewedArtists,
  reviewedTracks,
  trackArtists,
} from "@/db/schema";
import { db } from "@/index";
import { PAGE_SIZE } from "@/config/constants";

export class AlbumModel {
  static async findBySpotifyID(id: string) {
    return db
      .select()
      .from(reviewedAlbums)
      .where(eq(reviewedAlbums.spotifyID, id))
      .then(r => r[0]);
  }

  static async createAlbum(values: typeof reviewedAlbums.$inferInsert) {
    return db
      .insert(reviewedAlbums)
      .values(values)
      .returning()
      .then(r => r[0]);
  }

  static async updateAlbum(
    spotifyID: string,
    values: Partial<typeof reviewedAlbums.$inferInsert>
  ) {
    return db
      .update(reviewedAlbums)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async deleteAlbum(spotifyID: string) {
    return db.delete(reviewedAlbums).where(eq(reviewedAlbums.spotifyID, spotifyID));
  }

  static async getAllAlbums(): Promise<ReviewedAlbum[]> {
    return db.select().from(reviewedAlbums) as Promise<ReviewedAlbum[]>;
  }

  static async getAlbumsBySpotifyIDs(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(reviewedAlbums).where(inArray(reviewedAlbums.spotifyID, ids));
  }

  static async getPaginatedAlbums({
    page = 1,
    orderBy = "createdAt",
    order = "desc",
    search = "",
    genres,
    secondaryOrderBy,
    secondaryOrder,
  }: GetPaginatedAlbumsOptions) {
    const validOrderBy = ["finalScore", "releaseYear", "name", "createdAt"] as const;
    const validOrder = ["asc", "desc"] as const;
    const sortField = validOrderBy.includes(orderBy) ? orderBy : "finalScore";
    const sortDirection = validOrder.includes(order) ? order : "desc";
    const OFFSET = (page - 1) * PAGE_SIZE;

    // If requested genres, look up the matching album IDs
    let albumIds: string[] | undefined;
    if (genres?.length) {
      albumIds = await this.getAlbumIdsByGenres(genres);
      // nothing matched, early return empty result
      if (albumIds.length === 0) {
        return { albums: [], totalCount: 0, furtherPages: false };
      }
    }

    // Build exact same query, + one extra WHERE if albumIds is set
    let q: any = db
      .select()
      .from(reviewedAlbums)
      .where(albumIds ? inArray(reviewedAlbums.spotifyID, albumIds) : undefined);

    if (search.trim()) {
      q = q.where(
        sql`(reviewed_albums.name ILIKE ${`%${search.trim()}%`} 
           OR reviewed_albums.artist_name ILIKE ${`%${search.trim()}%`})`
      );
    }

    let baseOrder;
    if (orderBy === "releaseYear") {
      // When sorting by year, always use a secondary sort (default to finalScore if not provided)
      const validSecondaryOrderBy = ["finalScore", "name", "createdAt"] as const;
      const secondaryField = validSecondaryOrderBy.includes(secondaryOrderBy || "finalScore")
        ? secondaryOrderBy || "finalScore"
        : "finalScore";
      const secondaryDirection = validOrder.includes(secondaryOrder || "desc")
        ? secondaryOrder || "desc"
        : "desc";

      if (order === "asc") {
        baseOrder = [
          asc(reviewedAlbums[orderBy]),
          secondaryDirection === "asc"
            ? asc(reviewedAlbums[secondaryField])
            : desc(reviewedAlbums[secondaryField]),
        ];
      } else {
        baseOrder = [
          desc(reviewedAlbums[orderBy]),
          secondaryDirection === "asc"
            ? asc(reviewedAlbums[secondaryField])
            : desc(reviewedAlbums[secondaryField]),
        ];
      }
    } else {
      // Default sorting behavior
      baseOrder =
        order === "asc"
          ? [asc(reviewedAlbums[orderBy]), asc(reviewedAlbums.name)]
          : [desc(reviewedAlbums[orderBy]), desc(reviewedAlbums.name)];
    }

    const albums: DisplayAlbum[] = await q
      .orderBy(...baseOrder)
      .limit(PAGE_SIZE + 1)
      .offset(OFFSET);

    const furtherPages = albums.length > PAGE_SIZE;
    if (furtherPages) albums.pop();

    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(reviewedAlbums)
      .where(albumIds ? inArray(reviewedAlbums.spotifyID, albumIds) : undefined);

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
    const rows = await db
      .select()
      .from(reviewedAlbums)
      .innerJoin(albumArtists, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID))
      .where(eq(albumArtists.artistSpotifyID, spotifyID));
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

  static async getFeaturedAlbumIDsByArtist(artistID: string) {
    const rows = await db
      .select({ albumSpotifyID: reviewedTracks.albumSpotifyID })
      .from(reviewedTracks)
      .innerJoin(trackArtists, eq(reviewedTracks.spotifyID, trackArtists.trackSpotifyID))
      .leftJoin(
        albumArtists,
        and(
          eq(albumArtists.albumSpotifyID, reviewedTracks.albumSpotifyID),
          eq(albumArtists.artistSpotifyID, artistID)
        )
      )
      .where(
        and(eq(trackArtists.artistSpotifyID, artistID), isNull(albumArtists.artistSpotifyID))
      )
      .groupBy(reviewedTracks.albumSpotifyID);

    return rows.map(r => r.albumSpotifyID);
  }

  static async getAlbumArtistIDs(albumSpotifyID: string): Promise<string[]> {
    const rows = await db
      .select({ artistSpotifyID: albumArtists.artistSpotifyID })
      .from(albumArtists)
      .where(eq(albumArtists.albumSpotifyID, albumSpotifyID));
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

  static async upsertAlbumArtists(
    albumSpotifyID: string,
    entries: { artistSpotifyID: string; affectsScore: boolean }[]
  ) {
    if (entries.length === 0) return;
    return db
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

  static async unlinkArtistsFromAlbum(albumSpotifyID: string, artistIDs: string[]) {
    if (artistIDs.length === 0) return;
    return db
      .delete(albumArtists)
      .where(
        and(
          eq(albumArtists.albumSpotifyID, albumSpotifyID),
          inArray(albumArtists.artistSpotifyID, artistIDs)
        )
      );
  }

  static async getReviewScoresByIds(
    ids: string[]
  ): Promise<{ spotifyID: string; reviewScore: number }[]> {
    const rows = await db
      .select({
        spotifyID: reviewedAlbums.spotifyID,
        reviewScore: reviewedAlbums.reviewScore,
      })
      .from(reviewedAlbums)
      .where(inArray(reviewedAlbums.spotifyID, ids));

    return rows.map(r => ({
      spotifyID: r.spotifyID,
      reviewScore: r.reviewScore,
    }));
  }

  private static async getAlbumIdsByGenres(slugs: string[]): Promise<string[]> {
    if (!slugs.length) return [];

    // join album_genres -> genres, filter slug IN slugs
    // group by album, require COUNT(*) = slugs.length so we only get albums that matched every slug
    const rows = await db
      .select({ id: albumGenres.albumSpotifyID })
      .from(albumGenres)
      .innerJoin(genresTable, eq(genresTable.id, albumGenres.genreID))
      .where(inArray(genresTable.slug, slugs))
      .groupBy(albumGenres.albumSpotifyID)
      .having(sql`COUNT(*) = ${slugs.length}`);

    return rows.map(r => r.id);
  }
}
