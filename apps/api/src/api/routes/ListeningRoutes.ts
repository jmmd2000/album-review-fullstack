import { Hono } from "hono";
import { ListeningService } from "@/api/services/ListeningService";
import { ArtistListeningService } from "@/api/services/ArtistListeningService";
import { artistParamSchema } from "@/api/schemas/paramSchema";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { entryQuerySchema, importPlaysSchema, overTimeQuerySchema, playCountQuerySchema, topQuerySchema } from "@/api/schemas/listeningSchema";

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
    const { kind, period, from, to, by, show } = c.req.valid("query");
    return c.json(await ListeningService.getTop(kind, period, from, to, new Date(), by, show === "all"), 200);
  })
  .get("/over-time", validate("query", overTimeQuerySchema), async c => {
    const { period, from, to, kind, id } = c.req.valid("query");
    const entry = kind && id ? { kind, id } : undefined;
    return c.json(await ListeningService.getOverTime(period, from, to, new Date(), entry), 200);
  })
  .get("/entry", validate("query", entryQuerySchema), async c => {
    const { kind, id, period, from, to } = c.req.valid("query");
    return c.json(await ListeningService.getEntry(kind, id, period, from, to), 200);
  })
  .get("/artist/:artistID", validate("param", artistParamSchema, 404), async c => {
    return c.json(await ArtistListeningService.getArtistListening(c.req.valid("param").artistID), 200);
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
