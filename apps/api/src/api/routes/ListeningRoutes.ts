import { Hono } from "hono";
import { ListeningService } from "@/api/services/ListeningService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { entryQuerySchema, importPlaysSchema, playCountQuerySchema, topQuerySchema } from "@/api/schemas/listeningSchema";

// admin only
const listening = new Hono()
  .use(requireAdmin)
  .get("/", async c => {
    return c.json(await ListeningService.getStatus(), 200);
  })
  .post("/collect", async c => {
    return c.json(await ListeningService.collect(), 200);
  })
  .get("/top", validate("query", topQuerySchema), async c => {
    const { kind, period, from, to } = c.req.valid("query");
    return c.json(await ListeningService.getTop(kind, period, from, to), 200);
  })
  .get("/entry", validate("query", entryQuerySchema), async c => {
    const { kind, id, period, from, to } = c.req.valid("query");
    return c.json(await ListeningService.getEntry(kind, id, period, from, to), 200);
  })
  .get("/plays/count", validate("query", playCountQuerySchema), async c => {
    const { from, to } = c.req.valid("query");
    return c.json({ count: await ListeningService.countPlaysInRange(new Date(from), new Date(to)) }, 200);
  })
  .post("/import", validate("json", importPlaysSchema), async c => {
    const importedPlays = c.req.valid("json").plays.map(play => ({ ...play, playedAt: new Date(play.playedAt) }));
    return c.json(await ListeningService.importPlays(importedPlays), 200);
  });

export default listening;
