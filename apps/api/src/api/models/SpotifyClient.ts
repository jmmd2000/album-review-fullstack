import type { SpotifyAlbum, SpotifyArtist } from "@shared/types";
import { AppError } from "../AppError";
import { env } from "@/config/env";

/**
 * Raw calls to the Spotify Web API. It authenticates each request with a token it is handed
 * and returns Spotify's payloads as-is.
 */
export class SpotifyClient {
  private static readonly baseURL = "https://api.spotify.com/v1";
  private static readonly tokenURL = "https://accounts.spotify.com/api/token";

  /**
   * Exchanges the client credentials for a fresh access token
   */
  static async requestToken(): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch(this.tokenURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(env.SPOTIFY_CLIENT_ID + ":" + env.SPOTIFY_CLIENT_SECRET),
        },
        body: "grant_type=client_credentials",
      });
      if (!response.ok) throw new AppError("Failed to get Spotify access token.", 502);

      const data = await response.json();
      return { accessToken: data.access_token, expiresIn: data.expires_in };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Spotify authentication failed.", 502);
    }
  }

  static async searchAlbums(query: string, accessToken: string): Promise<{ albums: { items: SpotifyAlbum[] } }> {
    try {
      const endpoint = `${this.baseURL}/search?q=${encodeURIComponent(query)}&type=album&limit=10`;
      const response = await fetch(endpoint, { headers: this.authHeaders(accessToken) });
      if (!response.ok) throw new AppError("Spotify search failed.", 502);

      return await response.json();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to search albums on Spotify.", 500);
    }
  }

  static async getAlbum(albumID: string, accessToken: string): Promise<SpotifyAlbum> {
    try {
      const response = await fetch(`${this.baseURL}/albums/${albumID}`, { headers: this.authHeaders(accessToken) });
      if (!response.ok) throw new AppError("Album not found on Spotify", 404);

      return (await response.json()) as SpotifyAlbum;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to fetch album from Spotify.", 500);
    }
  }

  static async getArtists(ids: string[], accessToken: string): Promise<SpotifyArtist[]> {
    if (ids.length === 0) return [];

    try {
      // Fetch each artist individually in parallel; a failed lookup drops out.
      const results = await Promise.all(
        ids.map(async id => {
          const response = await fetch(`${this.baseURL}/artists/${id}`, { headers: this.authHeaders(accessToken) });
          if (!response.ok) return null;
          return await response.json();
        })
      );
      return results.filter((artist): artist is SpotifyArtist => artist !== null);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to fetch artist data from Spotify.", 502);
    }
  }

  private static authHeaders(accessToken: string) {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    };
  }
}
