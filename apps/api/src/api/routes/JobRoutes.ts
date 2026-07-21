import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { JobService } from "@/api/services/JobService";
import { ArtistService } from "@/api/services/ArtistService";
import { requireAdmin } from "@/api/middleware/requireAdmin";

const job = new Hono();

// admin only
job.use(requireAdmin);

job.post("artist-headers", c => {
  const jobID = JobService.create(emit => ArtistService.updateArtistHeaders(true, undefined, emit));
  return c.json({ jobID }, 202);
});

job.post("/artist-images", c => {
  const jobID = JobService.create(emit => ArtistService.updateArtistImages(true, undefined, emit));
  return c.json({ jobID }, 202);
});

job.get("/:id/events", c => {
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
