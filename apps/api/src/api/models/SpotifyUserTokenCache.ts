import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { SpotifyClient, SpotifyNotConnectedError } from "./SpotifyClient";

/**
 * Keeps an access token for the admin's own Spotify account, apart from the app token that SpotifyTokenCache keeps.
 * It refreshes the token from SPOTIFY_REFRESH_TOKEN once it expires.
 */
export class SpotifyUserTokenCache {
  private static accessToken: string | null = null;
  private static expiresAt: number | null = null;
  private static replacedRefreshToken: string | null = null;

  /** @throws SpotifyNotConnectedError when SPOTIFY_REFRESH_TOKEN isn't set or Spotify refuses it. */
  static async getAccessToken(): Promise<string> {
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    const refreshToken = this.replacedRefreshToken ?? env.SPOTIFY_REFRESH_TOKEN;
    if (!refreshToken) throw new SpotifyNotConnectedError();

    const reply = await SpotifyClient.refreshUserToken(refreshToken);
    if (reply.refreshToken && reply.refreshToken !== refreshToken) {
      this.replacedRefreshToken = reply.refreshToken;
      logger.warn("Spotify replaced the admin's refresh token. Run the spotify:token script again before the next restart.");
    }
    this.accessToken = reply.accessToken;
    this.expiresAt = Date.now() + reply.expiresIn * 1000;
    return reply.accessToken;
  }

  /** Drops the cached tokens so the next call starts again from SPOTIFY_REFRESH_TOKEN. */
  static clear() {
    this.accessToken = null;
    this.expiresAt = null;
    this.replacedRefreshToken = null;
  }
}
