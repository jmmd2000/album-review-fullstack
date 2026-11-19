import { Hono } from "hono";
import { DiscoverService } from "@/api/services/DiscoverService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { albumParamSchema } from "@/api/schemas/paramSchema";

// admin only
const discover = new Hono()
  .use(requireAdmin)
  .get("/", async c => {
    return c.json(await DiscoverService.getRows(), 200);
  })
  .post("/dismissed/:albumID", validate("param", albumParamSchema, 404), async c => {
    await DiscoverService.dismiss(c.req.valid("param").albumID);
    return c.body(null, 204);
  });

export default discover;
