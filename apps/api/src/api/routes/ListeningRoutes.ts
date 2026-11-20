import { Hono } from "hono";
import { ListeningService } from "@/api/services/ListeningService";
import { requireAdmin } from "@/api/middleware/requireAdmin";

// admin only
const listening = new Hono()
  .use(requireAdmin)
  .get("/", async c => {
    return c.json(await ListeningService.getStatus(), 200);
  })
  .post("/collect", async c => {
    return c.json(await ListeningService.collect(), 200);
  });

export default listening;
