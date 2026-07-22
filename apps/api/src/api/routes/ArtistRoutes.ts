import { Hono } from "hono";
import { z } from "zod";
import { ArtistService } from "@/api/services/ArtistService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";

const paginatedSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["totalScore", "peakScore", "latestScore", "reviewCount", "name", "createdAt", "leaderboardPosition"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  scoreType: z.enum(["overall", "peak", "latest"]).optional(),
});

const headerImageSchema = z.object({
  headerImage: z.string().nullable(),
});

// Static paths are registered before /:artistID so they aren't matched as an id.
const artist = new Hono()
  .get("/all", async c => {
    return c.json(await ArtistService.getAllArtists());
  })
  .get("/details/:artistID", async c => {
    return c.json(await ArtistService.getArtistDetails(c.req.param("artistID")));
  })
  .get("/:artistID", async c => {
    return c.json(await ArtistService.getArtistByID(c.req.param("artistID")));
  })
  .get("/", validate("query", paginatedSchema), async c => {
    return c.json(await ArtistService.getPaginatedArtists(c.req.valid("query")));
  })
  .put("/:artistID/headerImage", requireAdmin, validate("json", headerImageSchema), async c => {
    const { headerImage } = c.req.valid("json");
    await ArtistService.updateSingleArtistHeader(c.req.param("artistID"), headerImage);
    return c.json({ message: "Header image updated successfully" });
  })
  .delete("/:artistID", requireAdmin, async c => {
    await ArtistService.deleteArtist(c.req.param("artistID"));
    return c.body(null, 204);
  });

export default artist;
