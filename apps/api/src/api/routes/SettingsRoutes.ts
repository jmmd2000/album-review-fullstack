import { Hono } from "hono";
import { z } from "zod";
import { SettingsService } from "@/api/services/SettingsService";
import { BuildInfoService } from "@/api/services/BuildInfoService";
import { ArtistScoreService } from "@/api/services/ArtistScoreService";
import { findScheduledJob, scheduledJobs } from "@/api/services/ScheduledJobs";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { env } from "@/config/env";

const lastRunTypeSchema = z.object({
  type: z.enum(["images", "headers", "scores"], { error: "Resource must be 'images', 'headers', or 'scores'" }),
});

const intervalSchema = z.object({
  intervalDays: z.number({ error: "Choose how many days to wait between runs." }).int().min(0).max(365),
});

// admin only
const settings = new Hono()
  .use(requireAdmin)
  .get("/last-runs", async c => {
    return c.json(await SettingsService.getAllLastRuns(), 200);
  })
  .get("/job-intervals", async c => {
    const intervals: Record<string, number> = {};
    for (const job of scheduledJobs) {
      intervals[job.name] = await SettingsService.getIntervalDays(job.settingName);
    }
    return c.json({ intervals, scheduleEnabled: env.SCHEDULED_REFRESH }, 200);
  })
  .put("/job-intervals/:name", validate("json", intervalSchema), async c => {
    const job = findScheduledJob(c.req.param("name"));
    if (!job) return c.json({ message: "Job not found" }, 404);

    const { intervalDays } = c.req.valid("json");
    await SettingsService.setIntervalDays(job.settingName, intervalDays);
    return c.json({ intervalDays }, 200);
  })
  .get("/job-results", async c => {
    return c.json(await SettingsService.getJobResults(), 200);
  })
  .get("/last-runs/:type", validate("param", lastRunTypeSchema), async c => {
    const lastRun = await SettingsService.getLastRun(`artist_${c.req.valid("param").type}`);
    return c.json({ lastRun }, 200);
  })
  .post("/recalculate-scores", async c => {
    const result = await ArtistScoreService.recalculateAllArtistScores();
    await SettingsService.setLastRun("artist_scores");
    return c.json(result, 200);
  })
  .get("/build-info", async c => {
    return c.json(await BuildInfoService.getBuildInfo(), 200);
  });

export default settings;
