import { Hono } from "hono";
import { z } from "zod";
import { StatsService } from "@/api/services/StatsService";
import { validate } from "@/api/middleware/validate";

const distributionSchema = z.object({
  resource: z.enum(["albums", "tracks", "artists"], { error: "Resource must be 'albums', 'tracks', or 'artists'" }),
});

const stats = new Hono();

stats.get("/favourites", async c => {
  return c.json(await StatsService.getFavourites());
});

stats.get("/genres", async c => {
  return c.json(await StatsService.getGenreStats(c.req.query("slug")));
});

stats.get("/distribution", validate("query", distributionSchema), async c => {
  return c.json(await StatsService.getRatingDistribution(c.req.valid("query").resource));
});

stats.get("/counts", async c => {
  return c.json(await StatsService.getResourceCounts());
});

export default stats;
