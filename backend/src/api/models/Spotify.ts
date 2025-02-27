import { ExtractedColor, SpotifyAlbum, SpotifySearchResponse } from "@shared/types";
import { getImageColors } from "src/helpers/getImageColors";

export class Spotify {
  private static accessToken: string | null = null;
  private static expiresAt: number | null = null;

  static async getAccessToken() {
    // If token exists and is still valid, use it
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    const tokenEndpoint = "https://accounts.spotify.com/api/token";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET),
      },
      body: "grant_type=client_credentials",
    };

    // console.log(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_ID);

    const response = await fetch(tokenEndpoint, requestOptions);

    const data = await response.json();

    // Store token and expiration time (3600 seconds)
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000; // Convert to milliseconds

    // console.log({ accessToken: this.accessToken, expiresAt: this.expiresAt });
    return this.accessToken;
  }

  static async searchAlbums(query: string) {
    const endpoint = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=10`;
    const accessToken = await this.getAccessToken();
    console.log({ accessToken });
    const searchParamaters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    const response: Response = await fetch(endpoint, searchParamaters);

    const data = await response.json();
    console.log({ data });
    return data as SpotifySearchResponse;
  }

  static async getAlbum(albumID: string) {
    const endpoint = `https://api.spotify.com/v1/albums/${albumID}`;
    const accessToken = await this.getAccessToken();
    const searchParamaters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    const response: Response = await fetch(endpoint, searchParamaters);

    const data = await response.json();
    return data as SpotifyAlbum;
  }
}
