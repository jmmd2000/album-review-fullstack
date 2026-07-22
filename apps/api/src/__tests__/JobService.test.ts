import { test, expect } from "vitest";
import { JobService, type JobEvent } from "@/api/services/JobService";

const collect = async (stream: AsyncGenerator<JobEvent>): Promise<JobEvent[]> => {
  const events: JobEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
};

test("replays buffered events then ends with a done event", async () => {
  const id = JobService.create(async emit => {
    emit("progress", { index: 1 });
    emit("progress", { index: 2 });
  });

  const events = await collect(JobService.get(id)!.stream(-1));

  expect(events.map(e => e.event)).toEqual(["progress", "progress", "done"]);
  expect(events.map(e => e.id)).toEqual([0, 1, 2]);
});

test("resumes after a given event id, so a reconnect gets no duplicates", async () => {
  const id = JobService.create(async emit => {
    emit("progress", { index: 1 });
    emit("progress", { index: 2 });
  });

  const events = await collect(JobService.get(id)!.stream(0));

  // id 0 already seen, so only the second progress (id 1) and done (id 2) arrive
  expect(events.map(e => e.id)).toEqual([1, 2]);
});

test("surfaces a thrown runner error as a final error event", async () => {
  const id = JobService.create(async () => {
    throw new Error("boom");
  });

  const events = await collect(JobService.get(id)!.stream(-1));

  expect(events.map(e => e.event)).toEqual(["error", "done"]);
  expect((events[0].data as { message: string }).message).toBe("boom");
});
