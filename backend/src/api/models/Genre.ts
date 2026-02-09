import { albumGenres, genres, relatedGenres, reviewedAlbums } from "@/db/schema";
import { db } from "@/index";
import { AlbumGenre, Genre, RelatedGenre, ReviewedAlbum } from "@shared/types";
import { and, count, eq, inArray, or, sql } from "drizzle-orm";

export class GenreModel {
  static async getAllGenres(): Promise<Genre[]> {
    return db.select().from(genres);
  }

  static async getGenreCount() {
    return db
      .select({ count: count() })
      .from(genres)
      .then((r) => r[0].count);
  }

  static async findBySlug(slug: string) {
    return db
      .select()
      .from(genres)
      .where(eq(genres.slug, slug))
      .then((r) => r[0]);
  }

  static async createGenre(values: typeof genres.$inferInsert) {
    return db
      .insert(genres)
      .values(values)
      .returning()
      .then((r) => r[0]);
  }

  static async getGenreIDsForAlbum(albumSpotifyID: string): Promise<number[]> {
    const rows = await db.select({ genreID: albumGenres.genreID }).from(albumGenres).where(eq(albumGenres.albumSpotifyID, albumSpotifyID));
    return rows.map((r) => r.genreID);
  }

  static async getGenresForAlbumsRaw(albumSpotifyIDs: string[]) {
    if (albumSpotifyIDs.length === 0) return [];
    return db.select().from(albumGenres).innerJoin(genres, eq(genres.id, albumGenres.genreID)).where(inArray(albumGenres.albumSpotifyID, albumSpotifyIDs));
  }

  static async linkGenresToAlbum(albumSpotifyID: string, genreIDs: number[]) {
    if (genreIDs.length === 0) return;
    await db
      .insert(albumGenres)
      .values(genreIDs.map((gid) => ({ albumSpotifyID, genreID: gid })))
      .onConflictDoNothing({ target: [albumGenres.albumSpotifyID, albumGenres.genreID] });
  }

  static async unlinkGenresFromAlbum(albumSpotifyID: string, genreIDs: number[]) {
    if (genreIDs.length === 0) return;
    await db.delete(albumGenres).where(and(eq(albumGenres.albumSpotifyID, albumSpotifyID), inArray(albumGenres.genreID, genreIDs)));
  }

  static async getRelatedGenresRaw(genreID: number) {
    const forward = await db.select().from(relatedGenres).innerJoin(genres, eq(genres.id, relatedGenres.relatedGenreID)).where(eq(relatedGenres.genreID, genreID));
    const reverse = await db.select().from(relatedGenres).innerJoin(genres, eq(genres.id, relatedGenres.genreID)).where(eq(relatedGenres.relatedGenreID, genreID));
    return [...forward, ...reverse];
  }

  static async incrementRelatedStrength(genreIDs: number[]) {
    for (let i = 0; i < genreIDs.length; i++) {
      for (let j = i + 1; j < genreIDs.length; j++) {
        const [g1, g2] = genreIDs[i] < genreIDs[j] ? [genreIDs[i], genreIDs[j]] : [genreIDs[j], genreIDs[i]];

        await db
          .insert(relatedGenres)
          .values({ genreID: g1, relatedGenreID: g2, strength: 1 })
          .onConflictDoUpdate({
            target: [relatedGenres.genreID, relatedGenres.relatedGenreID],
            set: {
              strength: sql`${relatedGenres.strength} + 1`,
              updatedAt: sql`now()`,
            },
          });
      }
    }
  }

  static async decrementRelatedStrength(genreIDs: number[]) {
    for (let i = 0; i < genreIDs.length; i++) {
      for (let j = i + 1; j < genreIDs.length; j++) {
        const [g1, g2] = genreIDs[i] < genreIDs[j] ? [genreIDs[i], genreIDs[j]] : [genreIDs[j], genreIDs[i]];

        await db
          .update(relatedGenres)
          .set({
            strength: sql`GREATEST(${relatedGenres.strength} - 1, 0)`,
            updatedAt: sql`now()`,
          })
          .where(and(eq(relatedGenres.genreID, g1), eq(relatedGenres.relatedGenreID, g2)));
      }
    }
  }

  static async updateGenre(slug: string, values: Partial<typeof genres.$inferInsert>) {
    return db.update(genres).set(values).where(eq(genres.slug, slug));
  }

  static async deleteGenre(slug: string) {
    return db.delete(genres).where(eq(genres.slug, slug));
  }

  static async getAlbumCountByGenreID(genreID: number) {
    const result = await db
      .select({ count: count() })
      .from(albumGenres)
      .where(eq(albumGenres.genreID, genreID));
    return result[0].count;
  }

  static async deleteRelatedGenresByID(genreID: number) {
    await db.delete(relatedGenres).where(or(eq(relatedGenres.genreID, genreID), eq(relatedGenres.relatedGenreID, genreID)));
  }

  static async deleteGenreByID(genreID: number) {
    await db.delete(genres).where(eq(genres.id, genreID));
  }

  static async getAlbumsByGenreIDRaw(genreID: number) {
    return db.select().from(albumGenres).where(eq(albumGenres.genreID, genreID));
  }

  static async getAlbumsBySpotifyIDs(spotifyIDs: string[]): Promise<ReviewedAlbum[]> {
    if (spotifyIDs.length === 0) return [];
    return db.select().from(reviewedAlbums).where(inArray(reviewedAlbums.spotifyID, spotifyIDs)) as Promise<ReviewedAlbum[]>;
  }
}
