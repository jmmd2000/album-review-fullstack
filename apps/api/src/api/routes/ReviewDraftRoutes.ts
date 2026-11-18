import { Hono } from "hono";
import { ReviewDraftService } from "@/api/services/ReviewDraftService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { albumParamSchema } from "@/api/schemas/paramSchema";
import { saveDraftSchema } from "@/api/schemas/reviewDraftSchema";

// admin only
const drafts = new Hono()
  .use(requireAdmin)
  .get("/", async c => {
    return c.json({ albums: await ReviewDraftService.getDraftAlbums() }, 200);
  })
  .put("/:albumID", validate("param", albumParamSchema, 404), validate("json", saveDraftSchema), async c => {
    await ReviewDraftService.saveDraft(c.req.valid("param").albumID, c.req.valid("json"));
    return c.body(null, 204);
  })
  .delete("/:albumID", validate("param", albumParamSchema, 404), async c => {
    await ReviewDraftService.deleteDraft(c.req.valid("param").albumID);
    return c.body(null, 204);
  });

export default drafts;
