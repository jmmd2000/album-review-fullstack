import { PlayModel } from "@/api/models/Play";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyUserTokenCache } from "@/api/models/SpotifyUserTokenCache";
import { SettingsService } from "@/api/services/SettingsService";

/** The admin's Spotify listening: collecting plays from Spotify and reading them back. */
export class ListeningService {
  /**
   * Fetches the admin's latest 50 plays from Spotify and saves the ones the app doesn't have.
   * @returns How many new plays it saved.
   * @throws SpotifyNotConnectedError when the admin's Spotify account can't be read.
   */
  static async collect(): Promise<{ saved: number }> {
    const accessToken = await SpotifyUserTokenCache.getAccessToken();
    const spotifyPlays = await SpotifyClient.getRecentlyPlayed(accessToken);
    const saved = await PlayModel.savePlays(spotifyPlays);
    await SettingsService.setLastRun("listening");
    return { saved };
  }
}
