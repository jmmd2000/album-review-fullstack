import { Hono } from "hono";
import { z } from "zod";
import { AlbumService } from "@/api/services/AlbumService";
import { reviewDataSchema } from "@/api/schemas/reviewSchema";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";

const paginatedSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["finalScore", "releaseYear", "name", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  genres: z.string().optional(),
  secondaryOrderBy: z.enum(["finalScore", "name", "createdAt"]).optional(),
  secondaryOrder: z.enum(["asc", "desc"]).optional(),
});

const idsSchema = z.object({
  ids: z.string().min(1, "ids parameter is required"),
});

const allAlbumsSchema = z.object({
  includeCounts: z.enum(["true", "false"]).optional(),
});

// Static paths are registered before /:albumID so "all"/"scores" aren't matched as an id.
const album = new Hono()
  .get("/all", validate("query", allAlbumsSchema), async c => {
    const albums = await AlbumService.getAllAlbums(c.req.valid("query").includeCounts === "true");
    return c.json(albums, 200);
  })
  .get("/scores", validate("query", idsSchema), async c => {
    const { ids } = c.req.valid("query");
    const idList = ids.includes(",") ? ids.split(",").map(s => s.trim()) : [ids];
    return c.json(await AlbumService.getReviewScoresByIds(idList), 200);
  })
  .get("/:albumID", async c => {
    const data = await AlbumService.getAlbumByID(c.req.param("albumID"), c.req.query("includeGenres") !== "false");
    return c.json(data, 200);
  })
  .get("/", validate("query", paginatedSchema), async c => {
    const { genres, ...opts } = c.req.valid("query");
    const genreList = genres
      ? genres
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      : undefined;
    return c.json(await AlbumService.getPaginatedAlbums({ ...opts, genres: genreList }), 200);
  })
  .post("/create", requireAdmin, validate("json", reviewDataSchema), async c => {
    const reviewedAlbum = await AlbumService.createAlbumReview(c.req.valid("json"));
    return c.json(reviewedAlbum, 201);
  })
  .delete("/:albumID", requireAdmin, async c => {
    await AlbumService.deleteAlbum(c.req.param("albumID"));
    return c.body(null, 204);
  })
  .put("/:albumID/edit", requireAdmin, validate("json", reviewDataSchema), async c => {
    const updated = await AlbumService.updateAlbumReview(c.req.valid("json"), c.req.param("albumID"));
    return c.json(updated, 200);
  });

export default album;
