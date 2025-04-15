import { SearchAlbumsOptions } from "@shared/types";
import { Spotify } from "../models/Spotify";
import { getAllGenres } from "../../helpers/getAllGenres";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions) {
    return await Spotify.searchAlbums(query);
  }

  static async getAlbum(id: string, includeGenres: boolean = true) {
    const album = await Spotify.getAlbum(id);
    if (!includeGenres) {
      return album;
    }

    const genres = await getAllGenres();
    return { album, genres };
  }
}
