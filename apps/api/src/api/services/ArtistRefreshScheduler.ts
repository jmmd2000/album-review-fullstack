import { logger } from "@/config/logger";
import { env } from "@/config/env";
import { ArtistImageService, type ArtistImageJob } from "@/api/services/ArtistImageService";
import { SettingsService } from "@/api/services/SettingsService";
import type { JobEmit } from "@/api/services/JobService";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Scheduled runs start in this hour, in UTC */
const RUN_HOUR_UTC = 3;
// A run finishes a few minutes after 3am, so a run exactly a week later would not be due yet. Half a day margin to fix
const DUE_SLACK_MS = DAY_MS / 2;

/**
 * Tells whether a job is due. A job that never ran is due. An interval of 0 days means the schedule is off.
 */
export function isRefreshDue(lastRun: Date | null, intervalDays: number, now: Date): boolean {
  if (intervalDays === 0) return false;
  if (!lastRun) return true;
  return now.getTime() - lastRun.getTime() >= intervalDays * DAY_MS - DUE_SLACK_MS;
}

const logFailures: JobEmit = (event, data) => {
  if (event !== "failed") return;
  logger.warn({ data }, "Scheduled artist refresh failed for an artist");
};

async function runIfDue(job: ArtistImageJob, intervalDays: number, now: Date): Promise<void> {
  if (!isRefreshDue(await SettingsService.getLastRun(job), intervalDays, now)) return;
  if (ArtistImageService.isRunning(job)) {
    logger.info({ job }, "Scheduled artist refresh skipped, a run is already going");
    return;
  }

  logger.info({ job }, "Scheduled artist refresh started");
  try {
    if (job === "images") await ArtistImageService.updateArtistImages(true, undefined, logFailures, "scheduled");
    else await ArtistImageService.updateArtistHeaders(true, undefined, logFailures, "scheduled");
    logger.info({ job }, "Scheduled artist refresh finished");
  } catch (error) {
    logger.error({ job, error }, "Scheduled artist refresh stopped early");
  }
}

/** Runs the artist photo and header refreshes by themselves, in the early hours, when they are due. */
export const ArtistRefreshScheduler = {
  /**
   * Checks once an hour for refreshes that are due. Does nothing unless SCHEDULED_REFRESH is on.
   */
  start(): void {
    if (!env.SCHEDULED_REFRESH) {
      logger.info("Scheduled artist refresh is off on this server");
      return;
    }
    setInterval(() => void ArtistRefreshScheduler.runDueRefreshes(new Date()), HOUR_MS);
    logger.info("Scheduled artist refresh is on");
  },

  /**
   * Runs the photo refresh and then the header refresh, each only if it is due.
   * Does nothing outside the scheduled hour.
   */
  async runDueRefreshes(now: Date): Promise<void> {
    if (now.getUTCHours() !== RUN_HOUR_UTC) return;
    const intervalDays = await SettingsService.getRefreshIntervalDays();
    await runIfDue("images", intervalDays, now);
    await runIfDue("headers", intervalDays, now);
  },
};
