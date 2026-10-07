import { Hono } from "hono";
import { z } from "zod";
import { SettingsService } from "@/api/services/SettingsService";
import { BuildInfoService } from "@/api/services/BuildInfoService";
import { ArtistScoreService } from "@/api/services/ArtistScoreService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { env } from "@/config/env";

const lastRunTypeSchema = z.object({
  type: z.enum(["images", "headers", "scores"], { error: "Resource must be 'images', 'headers', or 'scores'" }),
});

const refreshIntervalSchema = z.object({
  intervalDays: z.number({ error: "Choose how many days to wait between refreshes." }).int().min(0).max(365),
});

const setSettingSchema = z.object({
  value: z.string(),
});

// admin only
const settings = new Hono()
  .use(requireAdmin)
  .get("/last-runs", async c => {
    return c.json(await SettingsService.getAllLastRuns(), 200);
  })
  .get("/refresh-interval", async c => {
    return c.json({ intervalDays: await SettingsService.getRefreshIntervalDays(), scheduleEnabled: env.SCHEDULED_REFRESH }, 200);
  })
  .put("/refresh-interval", validate("json", refreshIntervalSchema), async c => {
    const { intervalDays } = c.req.valid("json");
    await SettingsService.setRefreshIntervalDays(intervalDays);
    return c.json({ intervalDays }, 200);
  })
  .get("/job-results", async c => {
    return c.json(await SettingsService.getJobResults(), 200);
  })
  .get("/last-runs/:type", validate("param", lastRunTypeSchema), async c => {
    const lastRun = await SettingsService.getLastRun(c.req.valid("param").type);
    return c.json({ lastRun }, 200);
  })
  .get("/setting/:key", async c => {
    const key = c.req.param("key");
    const value = await SettingsService.get(key);
    return c.json({ key, value }, 200);
  })
  .put("/setting/:key", validate("json", setSettingSchema), async c => {
    const key = c.req.param("key");
    const { value } = c.req.valid("json");
    await SettingsService.set(key, value);
    return c.json({ key, value, message: "Setting updated successfully" }, 200);
  })
  .post("/recalculate-scores", async c => {
    const result = await ArtistScoreService.recalculateAllArtistScores();
    await SettingsService.setLastRun("scores");
    return c.json(result, 200);
  })
  .get("/build-info", async c => {
    return c.json(await BuildInfoService.getBuildInfo(), 200);
  });

export default settings;
