import { Hono } from "hono";
import { z } from "zod";
import type { SearchAlbumsOptions } from "@shared/types";
import { SpotifyService } from "@/api/services/SpotifyService";
import { validate } from "@/api/middleware/validate";

const searchSchema = z.object({
  query: z.string({ error: "Search query is required." }).refine(value => value.trim().length > 0, "Search query is required."),
});

const spotify = new Hono();

spotify.get("/token", async c => {
  return c.json({ token: await SpotifyService.getAccessToken() });
});

// Static /albums/search is registered before /albums/:albumID so "search" isn't matched as an id.
spotify.get("/albums/search", validate("query", searchSchema), async c => {
  const options: SearchAlbumsOptions = { query: c.req.valid("query").query };
  return c.json(await SpotifyService.searchAlbums(options));
});

spotify.get("/albums/:albumID", async c => {
  const data = await SpotifyService.getAlbum(c.req.param("albumID"), c.req.query("includeGenres") !== "false");
  return c.json(data);
});

export default spotify;
