import { Hono } from "hono";
import { z } from "zod";
import { ArtistService } from "@/api/services/ArtistService";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { artistParamSchema } from "@/api/schemas/paramSchema";

const paginatedSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(["totalScore", "peakScore", "latestScore", "reviewCount", "name", "createdAt", "leaderboardPosition"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
});

const headerImageSchema = z.object({
  headerImage: z.url({ protocol: /^https?$/, error: "The header image must be a web link." }).nullable(),
});

// Static paths are registered before /:artistID so they aren't matched as an id.
const artist = new Hono()
  .get("/all", async c => {
    return c.json(await ArtistService.getAllArtists(), 200);
  })
  .get("/details/:artistID", validate("param", artistParamSchema, 404), async c => {
    return c.json(await ArtistService.getArtistDetails(c.req.valid("param").artistID), 200);
  })
  .get("/:artistID", validate("param", artistParamSchema, 404), async c => {
    return c.json(await ArtistService.getArtistByID(c.req.valid("param").artistID), 200);
  })
  .get("/", validate("query", paginatedSchema), async c => {
    return c.json(await ArtistService.getPaginatedArtists(c.req.valid("query")), 200);
  })
  .put("/:artistID/headerImage", requireAdmin, validate("param", artistParamSchema, 404), validate("json", headerImageSchema), async c => {
    const { headerImage } = c.req.valid("json");
    await ArtistImageService.updateSingleArtistHeader(c.req.valid("param").artistID, headerImage);
    return c.json({ message: "Header image updated successfully" }, 200);
  })
  .delete("/:artistID", requireAdmin, validate("param", artistParamSchema, 404), async c => {
    await ArtistService.deleteArtist(c.req.valid("param").artistID);
    return c.body(null, 204);
  });

export default artist;
