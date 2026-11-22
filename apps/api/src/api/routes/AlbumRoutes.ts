import { Hono } from "hono";
import { z } from "zod";
import { AlbumService } from "@/api/services/AlbumService";
import { ReviewService } from "@/api/services/ReviewService";
import { ListenerLinkService } from "@/api/services/ListenerLinkService";
import { reviewDataSchema } from "@/api/schemas/reviewSchema";
import { isAdminRequest, requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { albumParamSchema, includeGenresSchema } from "@/api/schemas/paramSchema";

const paginatedSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["finalScore", "releaseYear", "name", "createdAt", "plays", "minutes"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  genres: z.string().optional(),
  secondaryOrderBy: z.enum(["finalScore", "name", "createdAt"]).optional(),
  secondaryOrder: z.enum(["asc", "desc"]).optional(),
});

const album = new Hono()
  .get("/:albumID", validate("param", albumParamSchema, 404), validate("query", includeGenresSchema), async c => {
    const data = await AlbumService.getAlbumByID(c.req.valid("param").albumID, c.req.valid("query").includeGenres === "true");
    return c.json(data, 200);
  })
  .get("/:albumID/related", validate("param", albumParamSchema, 404), async c => {
    return c.json(await AlbumService.getRelatedAlbums(c.req.valid("param").albumID), 200);
  })
  .get("/", validate("query", paginatedSchema), async c => {
    const { genres, ...opts } = c.req.valid("query");
    if ((opts.orderBy === "plays" || opts.orderBy === "minutes") && !isAdminRequest(c)) return c.json({ message: "Only the admin can sort by plays or minutes." }, 401);
    const genreList = genres
      ? genres
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      : undefined;
    return c.json(await AlbumService.getPaginatedAlbums({ ...opts, genres: genreList }), 200);
  })
  .post("/create", requireAdmin, validate("json", reviewDataSchema), async c => {
    const reviewedAlbum = await ReviewService.createAlbumReview(c.req.valid("json"));
    void ListenerLinkService.linkNewArtists(reviewedAlbum.spotifyID);
    return c.json(reviewedAlbum, 201);
  })
  .delete("/:albumID", requireAdmin, validate("param", albumParamSchema, 404), async c => {
    await ReviewService.deleteAlbum(c.req.valid("param").albumID);
    return c.body(null, 204);
  })
  .put("/:albumID/edit", requireAdmin, validate("param", albumParamSchema, 404), validate("json", reviewDataSchema), async c => {
    const albumID = c.req.valid("param").albumID;
    const updated = await ReviewService.updateAlbumReview(c.req.valid("json"), albumID);
    void ListenerLinkService.linkNewArtists(albumID);
    return c.json(updated, 200);
  });

export default album;
