import { randomUUID } from "crypto";

export type JobEvent = {
  /** Counts up from 0. It is also the SSE event id, so a client that reconnects can resume. */
  id: number;
  event: string;
  data?: unknown;
};

/** Reports progress from inside a running job */
export type JobEmit = (event: string, data?: unknown) => void;

type JobRunner = (emit: JobEmit) => Promise<void>;

// A finished job stays this long, so a client that reconnects can still replay its result
const DONE_TTL_MS = 5 * 60 * 1000;

/** One background job: a buffer of its progress events, added to and never changed. */
class Job {
  private readonly events: JobEvent[] = [];
  private done = false;
  private nextID = 0;
  private waiters: (() => void)[] = [];

  /** Adds an event and wakes the streams that wait for one. */
  push(event: string, data?: unknown): void {
    this.events.push({ id: this.nextID++, event, data });
    this.wake();
  }

  /** Adds the final "done" event and marks the job finished. */
  finish(): void {
    this.push("done");
    this.done = true;
    this.wake();
  }

  private wake(): void {
    const waiters = this.waiters;
    this.waiters = [];
    for (const resolve of waiters) resolve();
  }

  /**
   * Yields every event after `afterID` (use -1 for the whole buffer), the live
   * events as they arrive, and returns once the job is done. Event IDs equal
   * their buffer index, so resuming is a plain offset.
   * @param afterID The last event ID the caller already has, or -1 for none.
   */
  async *stream(afterID: number): AsyncGenerator<JobEvent> {
    let cursor = Math.max(0, afterID + 1);
    while (true) {
      while (cursor < this.events.length) yield this.events[cursor++];
      if (this.done) return;
      await new Promise<void>(resolve => this.waiters.push(resolve));
    }
  }
}

const jobs = new Map<string, Job>();

/**
 * In-memory runner for detached background jobs. A job is started with a runner
 * that reports progress through `emit`. The events are buffered so an SSE stream
 * can replay them from any point and follow along until the job is done.
 */
export const JobService = {
  /**
   * Starts `runner` in the background and returns its job id at once. The runner
   * reports progress through `emit`. If it throws, the job sends a "fatal" event
   * with the error message before "done". The job is removed a few minutes after
   * it finishes.
   *
   * @param runner The work to run, detached from any request.
   * @returns The new job's id.
   */
  create(runner: JobRunner): string {
    const id = randomUUID();
    const job = new Job();
    jobs.set(id, job);

    void (async () => {
      try {
        await runner((event, data) => job.push(event, data));
      } catch (error) {
        // Not "error": EventSource uses that name for its own connection errors
        job.push("fatal", { message: (error as Error).message });
      } finally {
        job.finish();
        setTimeout(() => jobs.delete(id), DONE_TTL_MS).unref();
      }
    })();

    return id;
  },

  /** Gets a job by id. Gives undefined if the job never existed or was removed. */
  get(id: string): Job | undefined {
    return jobs.get(id);
  },
};
