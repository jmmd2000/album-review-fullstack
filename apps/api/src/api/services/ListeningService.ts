import { PlayModel } from "@/api/models/Play";
import { SpotifyClient, SpotifyNotConnectedError } from "@/api/models/SpotifyClient";
import { SpotifyUserTokenCache } from "@/api/models/SpotifyUserTokenCache";
import { SettingsService } from "@/api/services/SettingsService";
import { env } from "@/config/env";
import { reportError } from "@/config/errorReporting";
import { logger } from "@/config/logger";

const COLLECT_INTERVAL_MS = 15 * 60 * 1000;
const LAST_ERROR_KEY = "listening_last_error";

/** The admin's Spotify listening: collecting plays from Spotify and reading them back. */
export class ListeningService {
  private static running: Promise<{ saved: number }> | null = null;
  /** Set when Spotify refuses the admin's sign-in. Scheduled collections stop until a collection works again. */
  private static disconnected = false;
  /** Set once a failure is reported, so a run of failures sends one report */
  private static failureReported = false;

  /**
   * Collects plays now, then every 15 minutes. Does nothing unless SCHEDULED_REFRESH is on and SPOTIFY_REFRESH_TOKEN is set.
   */
  static start(): void {
    if (!env.SCHEDULED_REFRESH) return;
    if (!env.SPOTIFY_REFRESH_TOKEN) {
      logger.info("Listening collection is off, because Spotify isn't connected");
      return;
    }
    void this.collectOnSchedule();
    setInterval(() => void this.collectOnSchedule(), COLLECT_INTERVAL_MS);
    logger.info("Listening collection is on");
  }

  /** Runs one scheduled collection. Skips it while Spotify is disconnected. A failure is saved and reported by collect. */
  static async collectOnSchedule(): Promise<void> {
    if (this.disconnected) return;
    try {
      await this.collect();
    } catch {
      return;
    }
  }

  /**
   * Fetches the admin's latest 50 plays from Spotify and saves the ones the app doesn't have.
   * A call while a collection is running waits for that collection instead of starting another.
   * A failure is saved as the last error, and the first failure in a row is reported.
   * @returns How many new plays it saved.
   * @throws SpotifyNotConnectedError when the admin's Spotify account can't be read, or the error that stopped the collection.
   */
  static async collect(): Promise<{ saved: number }> {
    if (this.running) return this.running;

    this.running = this.collectOnce().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private static async collectOnce(): Promise<{ saved: number }> {
    try {
      const accessToken = await SpotifyUserTokenCache.getAccessToken();
      const spotifyPlays = await SpotifyClient.getRecentlyPlayed(accessToken);
      const saved = await PlayModel.savePlays(spotifyPlays);
      await SettingsService.setLastRun("listening");
      await SettingsService.delete(LAST_ERROR_KEY);
      this.disconnected = false;
      this.failureReported = false;
      return { saved };
    } catch (error) {
      await this.saveFailure(error);
      throw error;
    }
  }

  private static async saveFailure(error: unknown): Promise<void> {
    if (error instanceof SpotifyNotConnectedError) this.disconnected = true;
    const message = error instanceof Error ? error.message : String(error);
    logger.warn({ error }, "Collecting plays from Spotify failed");
    await SettingsService.set(LAST_ERROR_KEY, message);

    if (this.failureReported) return;
    this.failureReported = true;
    reportError(error, { job: "listening" });
  }
}
