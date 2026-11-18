import type { z } from "zod";
import { AppError } from "../AppError";
import { env } from "@/config/env";
import { albumReplySchema, albumSearchResponseSchema, albumTrackPageSchema, artistResponseSchema, tokenResponseSchema } from "@/api/schemas/spotifySchema";
import type { SpotifyAlbumResponse, SpotifyAlbumSearchResponse, SpotifyArtistResponse } from "@/api/schemas/spotifySchema";

/**
 * Raw calls to the Spotify Web API. It authenticates each request with a token it is handed,
 * and checks each reply has the fields the app reads before it returns it.
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

      const data = this.parseReply(tokenResponseSchema, await response.json(), "a token");
      return { accessToken: data.access_token, expiresIn: data.expires_in };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Spotify authentication failed.", 502);
    }
  }

  static async searchAlbums(query: string, accessToken: string): Promise<SpotifyAlbumSearchResponse> {
    try {
      const endpoint = `${this.baseURL}/search?q=${encodeURIComponent(query)}&type=album&limit=10`;
      const response = await fetch(endpoint, { headers: this.authHeaders(accessToken) });
      if (!response.ok) throw new AppError("Spotify search failed.", 502);

      return this.parseReply(albumSearchResponseSchema, await response.json(), "search results");
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to search albums on Spotify.", 500);
    }
  }

  /**
   * Fetches an album with every track. The album reply holds the first 50 tracks, so this follows
   * each `next` link until the last page.
   * @throws AppError 404 for an unknown album, 502 when a later page of tracks fails or can't be read.
   */
  static async getAlbum(albumID: string, accessToken: string): Promise<SpotifyAlbumResponse> {
    try {
      const response = await fetch(`${this.baseURL}/albums/${albumID}`, { headers: this.authHeaders(accessToken) });
      if (!response.ok) throw new AppError("Album not found on Spotify", 404);

      const album = this.parseReply(albumReplySchema, await response.json(), "an album");
      const tracks = [...album.tracks.items];
      let nextPage = album.tracks.next;
      while (nextPage) {
        const pageResponse = await fetch(nextPage, { headers: this.authHeaders(accessToken) });
        if (!pageResponse.ok) throw new AppError("Failed to fetch the rest of the album's tracks from Spotify.", 502);

        const page = this.parseReply(albumTrackPageSchema, await pageResponse.json(), "a page of tracks");
        tracks.push(...page.items);
        nextPage = page.next;
      }

      return { ...album, tracks: { items: tracks } };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to fetch album from Spotify.", 500);
    }
  }

  static async getArtists(ids: string[], accessToken: string): Promise<SpotifyArtistResponse[]> {
    if (ids.length === 0) return [];

    try {
      // A failed lookup drops out, but a reply the app can't read fails the whole call
      const results = await Promise.all(
        ids.map(async id => {
          const response = await fetch(`${this.baseURL}/artists/${id}`, { headers: this.authHeaders(accessToken) });
          if (!response.ok) return null;
          return this.parseReply(artistResponseSchema, await response.json(), "an artist");
        })
      );
      return results.filter(artist => artist !== null);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to fetch artist data from Spotify.", 502);
    }
  }

  /**
   * Checks a Spotify reply against its schema and returns only the fields the schema lists.
   * @throws AppError 502 that names the first field that doesn't match.
   */
  private static parseReply<Schema extends z.ZodType>(schema: Schema, body: unknown, what: string): z.output<Schema> {
    const result = schema.safeParse(body);
    if (result.success) return result.data;

    const field = result.error.issues[0]?.path.join(".") || "the reply";
    throw new AppError(`Spotify sent ${what} the app can't read: ${field} is missing or the wrong type.`, 502);
  }

  private static authHeaders(accessToken: string) {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    };
  }
}
