import { Hono } from "hono";
import { z } from "zod";
import { HomeService } from "@/api/services/HomeService";
import { validate } from "@/api/middleware/validate";

const searchSchema = z.object({
  query: z.string().trim().min(1, "Type something to search for.").max(100, "The search is too long."),
});

const home = new Hono()
  .get("/", async c => {
    return c.json(await HomeService.getOverview(), 200);
  })
  .get("/search", validate("query", searchSchema), async c => {
    return c.json(await HomeService.search(c.req.valid("query").query), 200);
  });

export default home;
