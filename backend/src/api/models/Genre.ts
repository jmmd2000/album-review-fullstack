import { albumGenres, genres, relatedGenres } from "@/db/schema";
import { db } from "@/index";
import { and, eq, inArray, sql } from "drizzle-orm";
import slugify from "slugify";

export class GenreModel {
  static async getAllGenres() {
    return db.select().from(genres);
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

  static async findOrCreateGenre(name: string): Promise<number> {
    const slug = slugify(name, { lower: true, strict: true });
    let g = await this.findBySlug(slug);
    if (g) return g.id;
    g = await this.createGenre({ name, slug });
    return g.id;
  }

  static async getGenreIDsForAlbum(albumSpotifyID: string): Promise<number[]> {
    const rows = await db.select({ genreID: albumGenres.genreID }).from(albumGenres).where(eq(albumGenres.albumSpotifyID, albumSpotifyID));
    return rows.map((r) => r.genreID);
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
}
