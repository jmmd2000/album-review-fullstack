import { albumGenres } from "@/db/schema";
import { db } from "@/index";
import { AlbumGenre } from "@shared/types";

export class AlbumGenreModel {
  static async getAllAlbumGenres(): Promise<AlbumGenre[]> {
    return db.select().from(albumGenres);
  }
}
