import { Hono } from "hono";
import { z } from "zod";
import type { SearchAlbumsOptions } from "@shared/types";
import { SpotifyService } from "@/api/services/SpotifyService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { albumParamSchema, includeGenresSchema } from "@/api/schemas/paramSchema";

const searchSchema = z.object({
  query: z.string({ error: "Search query is required." }).refine(value => value.trim().length > 0, "Search query is required."),
});

// admin only. Static /albums/search is registered before /albums/:albumID so "search" isn't matched as an id.
const spotify = new Hono()
  .use(requireAdmin)
  .get("/albums/search", validate("query", searchSchema), async c => {
    const options: SearchAlbumsOptions = { query: c.req.valid("query").query };
    return c.json(await SpotifyService.searchAlbums(options), 200);
  })
  .get("/albums/:albumID", validate("param", albumParamSchema, 404), validate("query", includeGenresSchema), async c => {
    const data = await SpotifyService.getAlbum(c.req.valid("param").albumID, c.req.valid("query").includeGenres !== "false");
    return c.json(data, 200);
  });

export default spotify;
