import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { JobService } from "@/api/services/JobService";
import { JobScheduler } from "@/api/services/JobScheduler";
import { findScheduledJob } from "@/api/services/ScheduledJobs";
import { requireAdmin } from "@/api/middleware/requireAdmin";
import { validate } from "@/api/middleware/validate";
import { jobParamSchema } from "@/api/schemas/paramSchema";

// admin only
const job = new Hono()
  .use(requireAdmin)
  .get("/running", c => {
    return c.json({ running: JobScheduler.getRunningJobIDs() }, 200);
  })
  .post("/:name", c => {
    const scheduledJob = findScheduledJob(c.req.param("name"));
    if (!scheduledJob) return c.json({ message: "Job not found" }, 404);

    const jobID = JobScheduler.runNow(scheduledJob);
    if (!jobID) return c.json({ message: scheduledJob.busyMessage }, 409);
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
