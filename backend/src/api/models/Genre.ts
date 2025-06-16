import { albumGenres, genres, relatedGenres } from "@/db/schema";
import { db } from "@/index";
import { Genre, RelatedGenre } from "@shared/types";
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

  static async getGenresForAlbums(albumSpotifyIDs: string[]): Promise<Genre[]> {
    if (albumSpotifyIDs.length === 0) return [];
    const rows = await db.select().from(albumGenres).innerJoin(genres, eq(genres.id, albumGenres.genreID)).where(inArray(albumGenres.albumSpotifyID, albumSpotifyIDs));

    rows.map((r) => ({
      id: r.genres.id,
      name: r.genres.name,
      slug: r.genres.slug,
      createdAt: r.genres.createdAt,
      updatedAt: r.genres.updatedAt,
    }));

    const uniqueGenres = Array.from(new Map(rows.map((r) => [r.genres.id, r.genres])).values());
    uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));
    return uniqueGenres;
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

  static async getRelatedGenres(slugs: string[], limit = 5): Promise<Genre[]> {
    const allResults: RelatedGenre[] = [];

    for (const slug of slugs) {
      // your existing per‐slug logic
      const found = await this.findBySlug(slug);
      if (!found) continue;
      const genreID = found.id;

      const forward = await db.select().from(relatedGenres).innerJoin(genres, eq(genres.id, relatedGenres.relatedGenreID)).where(eq(relatedGenres.genreID, genreID));

      const reverse = await db.select().from(relatedGenres).innerJoin(genres, eq(genres.id, relatedGenres.genreID)).where(eq(relatedGenres.relatedGenreID, genreID));

      const combined = [...forward, ...reverse].map((item) => ({
        name: item.genres.name,
        slug: item.genres.slug,
        genreID: item.related_genres.genreID,
        relatedGenreID: item.related_genres.relatedGenreID,
        strength: item.related_genres.strength,
        createdAt: item.related_genres.createdAt,
        updatedAt: item.related_genres.updatedAt,
      }));

      allResults.push(...combined);
    }

    // sort by strength desc
    allResults.sort((a, b) => b.strength - a.strength);

    // dedupe and take the top `limit`
    const seen = new Set<string>();
    const out: RelatedGenre[] = [];
    for (const r of allResults) {
      const key = `${r.genreID}-${r.relatedGenreID}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(r);
        if (out.length >= limit) break;
      }
    }

    const allGenres = await this.getAllGenres();
    const filteredGenres: Genre[] = allGenres.filter((g) => out.some((r) => g.id === r.genreID || g.id === r.relatedGenreID)).filter((g) => !slugs.includes(g.slug));

    return filteredGenres;
  }

  static async updateGenre(slug: string, values: Partial<typeof genres.$inferInsert>) {
    return db.update(genres).set(values).where(eq(genres.slug, slug));
  }

  static async deleteGenre(slug: string) {
    return db.delete(genres).where(eq(genres.slug, slug));
  }
}
