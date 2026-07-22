import { SpotifyClient } from "./SpotifyClient";

/**
 * Manages the Spotify access token lifecycle. Gives out the cached token while it is
 * still valid and fetches a fresh one through the http client once it expires.
 */
export class SpotifyTokenCache {
  private static accessToken: string | null = null;
  private static expiresAt: number | null = null;

  static async getAccessToken(): Promise<string> {
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    const { accessToken, expiresIn } = await SpotifyClient.requestToken();
    this.accessToken = accessToken;
    this.expiresAt = Date.now() + expiresIn * 1000;
    return accessToken;
  }

  /** Drops the cached token so the next call fetches a fresh one. */
  static clear() {
    this.accessToken = null;
    this.expiresAt = null;
  }
}
