import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { JobService } from "@/api/services/JobService";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { jobParamSchema } from "@/api/schemas/paramSchema";

// admin only
const job = new Hono()
  .use(requireAdmin)
  .post("/artist-headers", c => {
    if (ArtistImageService.isRunning("headers")) return c.json({ message: "The artist headers are already updating. Try again when that run finishes." }, 409);
    const jobID = JobService.create(emit => ArtistImageService.updateArtistHeaders(true, undefined, emit));
    return c.json({ jobID }, 202);
  })
  .post("/artist-images", c => {
    if (ArtistImageService.isRunning("images")) return c.json({ message: "The artist photos are already updating. Try again when that run finishes." }, 409);
    const jobID = JobService.create(emit => ArtistImageService.updateArtistImages(true, undefined, emit));
    return c.json({ jobID }, 202);
  })
  .get("/:id/events", validate("param", jobParamSchema, 404), c => {
    const found = JobService.get(c.req.valid("param").id);
    if (!found) return c.json({ message: "Job not found" }, 404);

    // resume from the last event the client saw if it is reconnecting
    const lastSeen = Number(c.req.header("Last-Event-ID"));
    const afterID = Number.isInteger(lastSeen) ? lastSeen : -1;

    return streamSSE(c, async stream => {
      for await (const event of found.stream(afterID)) {
        await stream.writeSSE({
          id: String(event.id),
          event: event.event,
          data: JSON.stringify(event.data ?? null),
        });
      }
    });
  });

export default job;
