import { Hono } from "hono";
import { z } from "zod";
import { SettingsService } from "@/api/services/SettingsService";
import { ArtistService } from "@/api/services/ArtistService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";

const lastRunTypeSchema = z.object({
  type: z.enum(["images", "headers", "scores"], { error: "Resource must be 'images', 'headers', or 'scores'" }),
});

const setSettingSchema = z.object({
  value: z.string(),
});

const settings = new Hono();

// admin only
settings.use(requireAdmin);

settings.get("/last-runs", async c => {
  return c.json(await SettingsService.getAllLastRuns());
});

settings.get("/last-runs/:type", validate("param", lastRunTypeSchema), async c => {
  const lastRun = await SettingsService.getLastRun(c.req.valid("param").type);
  return c.json({ lastRun });
});

settings.get("/setting/:key", async c => {
  const key = c.req.param("key");
  const value = await SettingsService.get(key);
  return c.json({ key, value });
});

settings.put("/setting/:key", validate("json", setSettingSchema), async c => {
  const key = c.req.param("key");
  const { value } = c.req.valid("json");
  await SettingsService.set(key, value);
  return c.json({ key, value, message: "Setting updated successfully" });
});

settings.post("/recalculate-scores", async c => {
  const result = await ArtistService.recalculateAllArtistScores();
  await SettingsService.setLastRun("scores");
  return c.json(result);
});

export default settings;
