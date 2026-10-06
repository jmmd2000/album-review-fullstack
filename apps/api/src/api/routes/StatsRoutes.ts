import { Hono } from "hono";
import { StatsService } from "@/api/services/StatsService";

const stats = new Hono().get("/", async c => {
  return c.json(await StatsService.getOverview(), 200);
});

export default stats;
