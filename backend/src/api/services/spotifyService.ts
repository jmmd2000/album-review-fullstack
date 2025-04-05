import { SearchAlbumsOptions } from "@shared/types";
import { Spotify } from "../models/Spotify";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions) {
    return await Spotify.searchAlbums(query);
  }

  static async getAlbum(albumID: string) {
    return await Spotify.getAlbum(albumID);
  }
}
