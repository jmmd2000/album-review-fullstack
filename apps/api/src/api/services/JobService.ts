import { randomUUID } from "crypto";

export type JobEvent = {
  /**Monotonic id, used as the SSE event id so a reconnecting client can resume */
  id: number;
  /** Event name */
  event: string;
  /**Optional payload */
  data?: unknown;
};

/** Reports progress from inside a running job */
export type JobEmit = (event: string, data?: unknown) => void;

type JobRunner = (emit: JobEmit) => Promise<void>;

// A finished job hangs around this long so a client that reconnects
// can still replay it's final result before it's dropped.
const DONE_TTL_MS = 5 * 60 * 1000;

/**A single background job, an append-only buffer of progress events */
class Job {
  private readonly events: JobEvent[] = [];
  private done = false;
  private nextID = 0;
  private waiters: (() => void)[] = [];

  /** Append an event and wake any streams waiting. */
  push(event: string, data?: unknown): void {
    this.events.push({ id: this.nextID++, event, data });
    this.wake();
  }

  /** Emit a final "done", mark the job finished, and wake streams */
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
   * Start `runner` in the background and return its job id immediately. The
   * runner reports progress via the `emit` it is passed, a thrown error is
   * surfaced as a final "error" event. The job is dropped a few minutes after it
   * finishes.
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
        job.push("error", { message: (error as Error).message });
      } finally {
        job.finish();
        setTimeout(() => jobs.delete(id), DONE_TTL_MS).unref();
      }
    })();

    return id;
  },

  /** Get a job by id, or undefined if it never existed or has been dropped */
  get(id: string): Job | undefined {
    return jobs.get(id);
  },
};
