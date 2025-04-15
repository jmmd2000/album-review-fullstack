import { SearchAlbumsOptions } from "@shared/types";
import { Spotify } from "@/api/models/Spotify";
import { getAllGenres } from "@/helpers/getAllGenres";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions) {
    // console.log("query", query.query);
    return await Spotify.searchAlbums(query);
  }

  static async getAlbum(id: string, includeGenres: boolean = true) {
    const album = await Spotify.getAlbum(id);
    console.log("album", album);
    if (!includeGenres) {
      return album;
    }

    const genres = await getAllGenres();
    return { album, genres };
  }
}
