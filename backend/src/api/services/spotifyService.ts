import { Spotify } from "../models/Spotify";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }
}
