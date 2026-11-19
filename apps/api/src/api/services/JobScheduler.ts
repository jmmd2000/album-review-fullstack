import { logger } from "@/config/logger";
import { env } from "@/config/env";
import { reportError } from "@/config/errorReporting";
import { JobService, type JobEmit } from "@/api/services/JobService";
import { SettingsService } from "@/api/services/SettingsService";
import { scheduledJobs, type ScheduledJob } from "@/api/services/ScheduledJobs";
import type { ArtistJobSource } from "@/api/schemas/artistJobResultSchema";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Scheduled runs start in this hour, in UTC */
const RUN_HOUR_UTC = 3;
// A run finishes a few minutes after 3am, so a run exactly a week later would not be due yet. Half a day margin to fix
const DUE_SLACK_MS = DAY_MS / 2;

const runningJobs = new Set<string>();

/**
 * Tells whether a job is due. A job that never ran is due. An interval of 0 days means the schedule is off.
 */
export function isRefreshDue(lastRun: Date | null, intervalDays: number, now: Date): boolean {
  if (intervalDays === 0) return false;
  if (!lastRun) return true;
  return now.getTime() - lastRun.getTime() >= intervalDays * DAY_MS - DUE_SLACK_MS;
}

/** Runs a job that already holds its running slot, saves the last run time when it finishes, and frees the slot. */
async function runClaimed(job: ScheduledJob, emit: JobEmit, source: ArtistJobSource): Promise<void> {
  try {
    await job.run(emit, source);
    await SettingsService.setLastRun(job.settingName);
  } finally {
    runningJobs.delete(job.name);
  }
}

async function runIfDue(job: ScheduledJob, now: Date): Promise<void> {
  const intervalDays = await SettingsService.getIntervalDays(job.settingName);
  if (!isRefreshDue(await SettingsService.getLastRun(job.settingName), intervalDays, now)) return;
  if (runningJobs.has(job.name)) {
    logger.info({ job: job.name }, "Scheduled job skipped, a run is already going");
    return;
  }
  runningJobs.add(job.name);

  const logFailures: JobEmit = (event, data) => {
    if (event !== "failed") return;
    logger.warn({ job: job.name, data }, "Scheduled job failed for one item");
  };

  logger.info({ job: job.name }, "Scheduled job started");
  try {
    await runClaimed(job, logFailures, "scheduled");
    logger.info({ job: job.name }, "Scheduled job finished");
  } catch (error) {
    logger.error({ job: job.name, error }, "Scheduled job stopped early");
    reportError(error, { job: job.name });
  }
}

/** Runs the scheduled jobs by themselves in the early hours when they are due, and runs one by hand on request. Only one run of each job goes at a time. */
export const JobScheduler = {
  /**
   * Checks once an hour for jobs that are due. Does nothing unless SCHEDULED_REFRESH is on.
   */
  start(): void {
    if (!env.SCHEDULED_REFRESH) {
      logger.info("Scheduled jobs are off on this server");
      return;
    }
    setInterval(() => void JobScheduler.runDueJobs(new Date()), HOUR_MS);
    logger.info("Scheduled jobs are on");
  },

  /**
   * Starts a run of the job in the background, for a person who asked for it.
   * @returns The background job's id, or null when a run of the job is already going.
   */
  runNow(job: ScheduledJob): string | null {
    if (runningJobs.has(job.name)) return null;
    runningJobs.add(job.name);
    return JobService.create(emit => runClaimed(job, emit, "manual"));
  },

  /** Tells whether a run of the job is going now. */
  isRunning(name: string): boolean {
    return runningJobs.has(name);
  },

  /**
   * Runs each job that is due on its own interval, one after the other, in list order. Does nothing outside the scheduled hour.
   */
  async runDueJobs(now: Date, jobs: ScheduledJob[] = scheduledJobs): Promise<void> {
    if (now.getUTCHours() !== RUN_HOUR_UTC) return;
    for (const job of jobs) {
      await runIfDue(job, now);
    }
  },
};
