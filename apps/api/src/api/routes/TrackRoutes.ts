import { Hono } from "hono";
import { TrackService } from "@/api/services/TrackService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { albumParamSchema } from "@/api/schemas/paramSchema";

const track = new Hono()
  .get("/:albumID", validate("param", albumParamSchema, 404), async c => {
    return c.json(await TrackService.getAlbumTracks(c.req.valid("param").albumID), 200);
  })
  .delete("/:albumID", requireAdmin, validate("param", albumParamSchema, 404), async c => {
    await TrackService.deleteTracksByAlbumID(c.req.valid("param").albumID);
    return c.body(null, 204);
  });

export default track;
