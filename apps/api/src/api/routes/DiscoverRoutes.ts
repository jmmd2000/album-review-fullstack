import { Hono } from "hono";
import { DiscoverService } from "@/api/services/DiscoverService";
import { requireAdmin } from "@/api/middleware/requireAdmin";

// admin only
const discover = new Hono().use(requireAdmin).get("/", async c => {
  return c.json(await DiscoverService.getRows(), 200);
});

export default discover;
