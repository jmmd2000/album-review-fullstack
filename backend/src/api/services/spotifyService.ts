import { Spotify } from "../models/Spotify";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }

  static async searchAlbums(query: string) {
    return await Spotify.searchAlbums(query);
  }

  static async getAlbum(albumID: string) {
    return await Spotify.getAlbum(albumID);
  }
}
