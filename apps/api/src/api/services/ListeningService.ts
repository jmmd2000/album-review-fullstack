import { AppError } from "@/api/AppError";
import { ListeningStatsModel, type Period, type PeriodName, type TimelineUnit, type TopEntry, type TopKind } from "@/api/models/ListeningStats";
import { PlayModel, type ImportedPlay, type ImportResult, type RecentPlay } from "@/api/models/Play";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { JobScheduler } from "@/api/services/JobScheduler";
import { findScheduledJob } from "@/api/services/ScheduledJobs";
import { z } from "zod";
import { SpotifyClient, SpotifyNotConnectedError } from "@/api/models/SpotifyClient";
import { SpotifyUserTokenCache } from "@/api/models/SpotifyUserTokenCache";
import { SettingsService } from "@/api/services/SettingsService";
import { env } from "@/config/env";
import { reportError } from "@/config/errorReporting";
import { logger } from "@/config/logger";

const COLLECT_INTERVAL_MS = 15 * 60 * 1000;
const LAST_ERROR_KEY = "listening_last_error";
const RECENT_PLAY_COUNT = 20;
const LAST_IMPORT_KEY = "listening_last_import";

const lastImportSchema = z.object({
  importedAt: z.coerce.date(),
  saved: z.number(),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

/** When the last streaming history import ran, how many plays it saved, and the dates it covered */
export type LastImport = z.infer<typeof lastImportSchema>;

/** How collection is going, for the Settings page */
export interface ListeningStatus {
  /** True when this server collects plays every 15 minutes by itself */
  scheduled: boolean;
  /** False when SPOTIFY_REFRESH_TOKEN isn't set or Spotify refused it */
  connected: boolean;
  lastCollected: Date | null;
  lastError: string | null;
  recentPlays: RecentPlay[];
  lastImport: LastImport | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days for up to about 2 months, weeks for up to about 6 months, then months. */
export function timelineUnit(period: Period, firstPlayAt: Date | null): TimelineUnit {
  const start = period.from ?? firstPlayAt ?? period.to;
  const days = (period.to.getTime() - start.getTime()) / DAY_MS;
  if (days <= 62) return "day";
  if (days <= 190) return "week";
  return "month";
}

/** One ranked entry, with its change in rank since the period before */
export interface RankedEntry extends TopEntry {
  /** Places moved up since the period before (negative is down), "new" when it wasn't played then, or null for all time */
  change: number | "new" | null;
}

/** The admin's Spotify listening: collecting plays from Spotify and reading them back. */
export class ListeningService {
  private static running: Promise<{ saved: number }> | null = null;
  /** Set when Spotify refuses the admin's sign-in. Scheduled collections stop until a collection works again. */
  private static disconnected = false;
  /** Set once a failure is reported, so a run of failures sends one report */
  private static failureReported = false;
  private static importing = false;

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

  static async getStatus(): Promise<ListeningStatus> {
    const connected = Boolean(env.SPOTIFY_REFRESH_TOKEN) && !this.disconnected;
    return {
      scheduled: env.SCHEDULED_REFRESH && Boolean(env.SPOTIFY_REFRESH_TOKEN),
      connected,
      lastCollected: await SettingsService.getLastRun("listening"),
      lastError: await SettingsService.get(LAST_ERROR_KEY),
      recentPlays: await PlayModel.getRecent(RECENT_PLAY_COUNT),
      lastImport: await SettingsService.getParsed(LAST_IMPORT_KEY, lastImportSchema),
    };
  }

  /**
   * The 50 most played artists, tracks, albums or genres in a period, with the period's totals.
   * Each entry's change compares it with the period of the same length just before.
   */
  static async getTop(kind: TopKind, periodName: PeriodName, customFrom?: string, customTo?: string, now: Date = new Date()) {
    const period = await ListeningStatsModel.resolvePeriod(periodName, now, customFrom, customTo);
    const previous = ListeningStatsModel.previousPeriod(period);
    const [top, totals] = await Promise.all([ListeningStatsModel.getTop(kind, period), ListeningStatsModel.getTotals(period)]);
    const previousRanks = previous
      ? await ListeningStatsModel.getRanks(
          kind,
          previous,
          top.map(entry => entry.id)
        )
      : null;

    const entries: RankedEntry[] = top.map(entry => {
      if (!previousRanks) return { ...entry, change: null };
      const previousRank = previousRanks.get(entry.id);
      return { ...entry, change: previousRank === undefined ? "new" : previousRank - entry.rank };
    });
    return { from: period.from, to: period.to, totals, entries };
  }

  /**
   * More about one entry: its first play, its plays in each of the last 12 weeks, its top tracks or a genre's top artists
   * and share of all plays in the period, and where it links.
   */
  static async getEntry(kind: TopKind, id: string, periodName: PeriodName, customFrom?: string, customTo?: string, now: Date = new Date()) {
    const period = await ListeningStatsModel.resolvePeriod(periodName, now, customFrom, customTo);
    const [firstPlayedAt, weeklyPlays, link] = await Promise.all([
      ListeningStatsModel.getFirstPlay(kind, id),
      ListeningStatsModel.getWeeklyPlays(kind, id, now),
      ListeningStatsModel.getLink(kind, id),
    ]);

    if (kind === "genres") {
      const [topArtists, genrePlays, totals] = await Promise.all([
        ListeningStatsModel.getGenreArtists(id, period),
        ListeningStatsModel.countEntryPlays(kind, id, period),
        ListeningStatsModel.getTotals(period),
      ]);
      return { firstPlayedAt, weeklyPlays, link, topTracks: [], topArtists, share: totals.plays > 0 ? genrePlays / totals.plays : 0 };
    }

    const topTracks = kind === "tracks" ? [] : await ListeningStatsModel.getTopTracks(kind, id, period);
    return { firstPlayedAt, weeklyPlays, link, topTracks, topArtists: [], share: null };
  }

  /** Plays over time for the period, in days, weeks or months to suit its length, and plays in each hour of each weekday. */
  static async getOverTime(periodName: PeriodName, customFrom?: string, customTo?: string, now: Date = new Date()) {
    const period = await ListeningStatsModel.resolvePeriod(periodName, now, customFrom, customTo);
    const firstPlayAt = period.from === null ? await ListeningStatsModel.getFirstPlayAt() : null;
    const unit = timelineUnit(period, firstPlayAt);
    const [timeline, clock] = await Promise.all([ListeningStatsModel.getTimeline(period, unit), ListeningStatsModel.getClock(period)]);
    return { unit, timeline, clock };
  }

  static async countPlaysInRange(from: Date, to: Date): Promise<number> {
    return PlayModel.countInRange(from, to);
  }

  /**
   * Replaces the saved plays in the import's date range with the imported plays.
   * @returns How many saved plays it removed, and how many imported plays it saved.
   * @throws AppError 409 when another import is running.
   */
  static async importPlays(importedPlays: ImportedPlay[]): Promise<ImportResult> {
    if (this.importing) throw new AppError("An import is already running. Try again when it finishes.", 409);

    this.importing = true;
    let result: ImportResult;
    try {
      result = await PlayModel.replaceRange(importedPlays);
    } finally {
      this.importing = false;
    }

    if (result.from && result.to) {
      await SettingsService.set(LAST_IMPORT_KEY, JSON.stringify({ importedAt: new Date(), saved: result.saved, from: result.from, to: result.to }));
    }
    void this.lookUpAfterImport().catch(error => {
      logger.error({ error }, "Looking up imported tracks stopped early");
      reportError(error, { job: "lookups after import" });
    });
    return result;
  }

  /**
   * Runs the Played tracks lookup until no tracks or artist photos are waiting, then the Played artist genres lookup until no artists are waiting.
   * Each is a normal run that Settings can follow. It stops a job early when a run leaves as much waiting as before, such as when Spotify refuses,
   * and stops when a person already started a run of that job.
   */
  static async lookUpAfterImport(): Promise<void> {
    const steps = [
      { job: findScheduledJob("played-tracks"), countWaiting: () => PlayedTrackModel.countLookupsWaiting() },
      { job: findScheduledJob("played-genres"), countWaiting: () => PlayedTrackModel.countGenresWaiting() },
    ];
    for (const { job, countWaiting } of steps) {
      if (!job) continue;
      let waiting = await countWaiting();
      while (waiting > 0) {
        const started = await JobScheduler.runAndWait(job);
        if (!started) return;
        const stillWaiting = await countWaiting();
        if (stillWaiting >= waiting) break;
        waiting = stillWaiting;
      }
    }
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
