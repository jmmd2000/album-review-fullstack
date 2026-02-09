import { GenreModel } from "@/api/models/Genre";
import { AppError } from "../middleware/errorHandler";
import { Genre, RelatedGenre } from "@shared/types";
import slugify from "slugify";

export class GenreService {
  static async getAllGenres() {
    return await GenreModel.getAllGenres();
  }

  static async findOrCreateGenre(name: string): Promise<number> {
    const slug = slugify(name, { lower: true, strict: true });

    let genre = await GenreModel.findBySlug(slug);
    if (genre) return genre.id;

    genre = await GenreModel.createGenre({ name, slug });
    return genre.id;
  }

  /**
   * Get all genres for a list of album IDs.
   * Returns deduplicated and sorted list of unique genres.
   */
  static async getGenresForAlbums(albumSpotifyIDs: string[]): Promise<Genre[]> {
    const rows = await GenreModel.getGenresForAlbumsRaw(albumSpotifyIDs);

    const genreMap = new Map<number, Genre>();
    for (const row of rows) {
      genreMap.set(row.genres.id, row.genres);
    }

    const uniqueGenres = Array.from(genreMap.values());
    uniqueGenres.sort((a, b) => a.name.localeCompare(b.name));
    return uniqueGenres;
  }

  /**
   * Get related genres for a list of genre slugs.
   * Returns related genres sorted by relationship strength.
   */
  static async getRelatedGenres(slugs: string[], limit = 5): Promise<Genre[]> {
    const allResults: RelatedGenre[] = [];

    for (const slug of slugs) {
      const genre = await GenreModel.findBySlug(slug);
      if (!genre) continue;

      const relatedRows = await GenreModel.getRelatedGenresRaw(genre.id);

      const combined = relatedRows.map(item => ({
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

    allResults.sort((a, b) => b.strength - a.strength);

    // Deduplicate and limit
    const seen = new Set<string>();
    const deduped: RelatedGenre[] = [];
    for (const result of allResults) {
      const key = `${result.genreID}-${result.relatedGenreID}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(result);
        if (deduped.length >= limit) break;
      }
    }

    // Get the actual Genre objects for the related genres
    const allGenres = await GenreModel.getAllGenres();
    const relatedGenreIds = new Set<number>();
    deduped.forEach(r => {
      relatedGenreIds.add(r.genreID);
      relatedGenreIds.add(r.relatedGenreID);
    });

    const filtered = allGenres
      .filter(g => relatedGenreIds.has(g.id))
      .filter(g => !slugs.includes(g.slug));

    return filtered;
  }

  static async deleteIfUnused(genreIDs: number[]) {
    for (const genreID of genreIDs) {
      const usageCount = await GenreModel.getAlbumCountByGenreID(genreID);

      if (usageCount === 0) {
        await GenreModel.deleteRelatedGenresByID(genreID);
        await GenreModel.deleteGenreByID(genreID);
      }
    }
  }

  static async getAlbumsByGenre(slug: string) {
    const genre = await GenreModel.findBySlug(slug);
    if (!genre) throw new AppError(`Genre with slug "${slug}" not found`, 404);

    const albumGenreRows = await GenreModel.getAlbumsByGenreIDRaw(genre.id);
    const albumSpotifyIDs = albumGenreRows.map(ag => ag.albumSpotifyID);

    if (albumSpotifyIDs.length === 0) return [];

    const albums = await GenreModel.getAlbumsBySpotifyIDs(albumSpotifyIDs);
    albums.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    return albums;
  }
}
