import { Hono } from "hono";
import { z } from "zod";
import { BookmarkedAlbumService } from "@/api/services/BookmarkedAlbumService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { albumParamSchema } from "@/api/schemas/paramSchema";

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
  .get("/all", async c => {
    return c.json(await BookmarkedAlbumService.getAllAlbums(), 200);
  })
  .get("/", validate("query", paginatedSchema), async c => {
    return c.json(await BookmarkedAlbumService.getPaginatedAlbums(c.req.valid("query")), 200);
  })
  .get("/:albumID", validate("param", albumParamSchema, 404), async c => {
    return c.json(await BookmarkedAlbumService.getAlbumByID(c.req.valid("param").albumID), 200);
  })
  .post("/:albumID/add", validate("param", albumParamSchema, 404), validate("json", bookmarkAlbumSchema), async c => {
    const bookmarkedAlbum = await BookmarkedAlbumService.bookmarkAlbum(c.req.valid("json"));
    return c.json(bookmarkedAlbum, 201);
  })
  .delete("/:albumID/remove", validate("param", albumParamSchema, 404), async c => {
    await BookmarkedAlbumService.removeBookmarkedAlbum(c.req.valid("param").albumID);
    return c.body(null, 204);
  });

export default bookmark;
