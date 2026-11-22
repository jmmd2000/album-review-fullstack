import { Hono } from "hono";
import { requireSummaryToken } from "@/api/middleware/requireSummaryToken";
import { validate } from "@/api/middleware/validate";
import { summaryQuerySchema } from "@/api/schemas/summarySchema";
import { ListeningSummaryService } from "@/api/services/ListeningSummaryService";

// Read-only, for other personal tools that hold SUMMARY_TOKEN
const summary = new Hono().use(requireSummaryToken).get("/days", validate("query", summaryQuerySchema), async c => {
  const { from, to } = c.req.valid("query");
  return c.json({ days: await ListeningSummaryService.getDays(from, to) }, 200);
});

export default summary;
