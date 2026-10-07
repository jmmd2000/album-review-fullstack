import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { JobService } from "@/api/services/JobService";
import { ArtistImageService } from "@/api/services/ArtistImageService";
import { requireAdmin } from "@/api/middleware/requireAdmin";

// admin only
const job = new Hono()
  .use(requireAdmin)
  .post("/artist-headers", c => {
    const jobID = JobService.create(emit => ArtistImageService.updateArtistHeaders(true, undefined, emit));
    return c.json({ jobID }, 202);
  })
  .post("/artist-images", c => {
    const jobID = JobService.create(emit => ArtistImageService.updateArtistImages(true, undefined, emit));
    return c.json({ jobID }, 202);
  })
  .get("/:id/events", c => {
    const found = JobService.get(c.req.param("id"));
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
