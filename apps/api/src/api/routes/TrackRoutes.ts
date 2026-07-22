import { Hono } from "hono";
import { TrackService } from "@/api/services/TrackService";
import { requireAdmin } from "@/api/middleware/requireAdmin";

const track = new Hono()
  .get("/:albumID", async c => {
    return c.json(await TrackService.getAlbumTracks(c.req.param("albumID")));
  })
  .delete("/:albumID", requireAdmin, async c => {
    await TrackService.deleteTracksByAlbumID(c.req.param("albumID"));
    return c.body(null, 204);
  });

export default track;
