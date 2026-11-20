import type { z } from "zod";
import { AppError } from "../AppError";
import { env } from "@/config/env";
import { albumReplySchema, albumSearchResponseSchema, albumTrackPageSchema, artistAlbumsResponseSchema, artistResponseSchema, tokenResponseSchema } from "@/api/schemas/spotifySchema";
import type { SpotifyAlbumResponse, SpotifyAlbumSearchResponse, SpotifyArtistAlbum, SpotifyArtistResponse } from "@/api/schemas/spotifySchema";

/** Spotify gives at most 10 search results a request */
export const SEARCH_PAGE_SIZE = 10;
/** Spotify refuses a search page that would reach past its 1000th result */
export const SEARCH_MAX_OFFSET = 1000 - SEARCH_PAGE_SIZE;

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

  static async searchAlbums(query: string, offset: number, accessToken: string): Promise<SpotifyAlbumSearchResponse> {
    try {
      const endpoint = `${this.baseURL}/search?q=${encodeURIComponent(query)}&type=album&limit=${SEARCH_PAGE_SIZE}&offset=${offset}`;
      const response = await fetch(endpoint, { headers: this.authHeaders(accessToken) });
      if (!response.ok) throw new AppError("Spotify search failed.", 502);

      return this.parseReply(albumSearchResponseSchema, await response.json(), "search results");
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to search albums on Spotify.", 500);
    }
  }

  /**
   * Fetches an album with all of its tracks.
   * @throws AppError 404 for an unknown album, 502 when a page of tracks fails or can't be read.
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

  /**
   * Fetches one artist.
   * @returns The artist, or null when Spotify answers with an error.
   * @throws AppError 502 when Spotify sends a reply the app can't read.
   */
  static async getArtist(artistID: string, accessToken: string): Promise<SpotifyArtistResponse | null> {
    const response = await fetch(`${this.baseURL}/artists/${artistID}`, { headers: this.authHeaders(accessToken) });
    if (!response.ok) return null;
    return this.parseReply(artistResponseSchema, await response.json(), "an artist");
  }

  static async getArtists(ids: string[], accessToken: string): Promise<SpotifyArtistResponse[]> {
    if (ids.length === 0) return [];

    try {
      // A failed lookup drops out, but a reply the app can't read fails the whole call
      const results = await Promise.all(ids.map(id => this.getArtist(id, accessToken)));
      return results.filter(artist => artist !== null);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to fetch artist data from Spotify.", 502);
    }
  }

  /**
   * Fetches the first page of an artist's albums, without singles, compilations or albums they only appear on.
   * @returns Up to 10 albums, or an empty list when Spotify doesn't know the artist.
   * @throws AppError 502 when Spotify fails or sends a reply the app can't read.
   */
  static async getArtistAlbums(artistID: string, accessToken: string): Promise<SpotifyArtistAlbum[]> {
    const response = await fetch(`${this.baseURL}/artists/${artistID}/albums?include_groups=album&limit=${SEARCH_PAGE_SIZE}`, { headers: this.authHeaders(accessToken) });
    if (response.status === 404) return [];
    if (!response.ok) throw new AppError(`Spotify answered ${response.status} for an artist's albums.`, 502);
    return this.parseReply(artistAlbumsResponseSchema, await response.json(), "an artist's albums").items;
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
