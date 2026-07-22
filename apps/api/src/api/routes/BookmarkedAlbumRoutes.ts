import { Hono } from "hono";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { BookmarkedAlbumService } from "@/api/services/BookmarkedAlbumService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";

const spotifyImageSchema = z.object({
  url: z.string(),
  height: z.number(),
  width: z.number(),
});

const bookmarkAlbumSchema = z.object({
  spotifyID: z.string().min(1),
  name: z.string().min(1),
  artistName: z.string().min(1),
  artistSpotifyID: z.string().min(1),
  releaseYear: z.number().int(),
  imageURLs: z.array(spotifyImageSchema),
  finalScore: z.number().nullable(),
  affectsArtistScore: z.boolean(),
});

const paginatedSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["artistName", "releaseYear", "name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
});

// admin only. Static paths are registered before /:albumID so they aren't matched as an id.
const bookmark = new Hono()
  .use(requireAdmin)
  .get("/status", async c => {
    // Accept ?ids=1,2,3 or repeated ?ids=1&ids=2
    const raw = c.req.queries("ids") ?? [];
    const ids = raw.flatMap(value => (value.includes(",") ? value.split(",") : [value])).filter(Boolean);
    if (ids.length === 0) throw new HTTPException(400, { message: "ids parameter is required." });

    const bookmarkedIds = await BookmarkedAlbumService.getBookmarkedByIds(ids);
    const statusMap: Record<string, boolean> = {};
    for (const id of ids) {
      statusMap[id] = bookmarkedIds.includes(id);
    }
    return c.json(statusMap);
  })
  .get("/all", async c => {
    return c.json(await BookmarkedAlbumService.getAllAlbums());
  })
  .get("/", validate("query", paginatedSchema), async c => {
    return c.json(await BookmarkedAlbumService.getPaginatedAlbums(c.req.valid("query")));
  })
  .get("/:albumID", async c => {
    return c.json(await BookmarkedAlbumService.getAlbumByID(c.req.param("albumID")));
  })
  .post("/:albumID/add", validate("json", bookmarkAlbumSchema), async c => {
    const bookmarkedAlbum = await BookmarkedAlbumService.bookmarkAlbum(c.req.valid("json"));
    return c.json(bookmarkedAlbum, 201);
  })
  .delete("/:albumID/remove", async c => {
    await BookmarkedAlbumService.removeBookmarkedAlbum(c.req.param("albumID"));
    return c.body(null, 204);
  });

export default bookmark;
