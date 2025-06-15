import { GenreModel } from "@/api/models/Genre";

export class GenreService {
  static async getAllGenres() {
    return await GenreModel.getAllGenres();
  }
}
