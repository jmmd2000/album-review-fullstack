import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useJobProgress } from "../useJobProgress";
import { client } from "@/lib/client";

// Replace the RPC client's job endpoints with mocks, but keep the real handle()
// so the response-unwrapping path is exercised for real.
vi.mock("@/lib/client", async importActual => {
  const actual = await importActual<typeof import("@/lib/client")>();
  return {
    ...actual,
    client: {
      api: {
        jobs: {
          "artist-images": { $post: vi.fn() },
          "artist-headers": { $post: vi.fn() },
        },
      },
    },
  };
});

const jsonResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Error",
  json: async () => data,
});

const imagesPost = client.api.jobs["artist-images"].$post as unknown as Mock;

/** Stand-in for the browser EventSource, driven by hand from the tests. */
class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];

  url: string;
  readyState = FakeEventSource.OPEN;
  onerror: (() => void) | null = null;
  private listeners = new Map<string, ((event: MessageEvent) => void)[]>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(event: string, callback: (event: MessageEvent) => void) {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, callback]);
  }

  emit(event: string, data?: unknown) {
    const message = { data: JSON.stringify(data ?? null) } as MessageEvent;
    for (const callback of this.listeners.get(event) ?? []) callback(message);
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
}

vi.stubGlobal("EventSource", FakeEventSource);

const progressPayload = (index: number, total: number) => ({ index, total, spotifyID: `artist-${index}`, artistName: `Artist ${index}` });

const lastSource = () => FakeEventSource.instances[FakeEventSource.instances.length - 1];

beforeEach(() => {
  localStorage.clear();
  FakeEventSource.instances = [];
  vi.clearAllMocks();
});

describe("useJobProgress", () => {
  it("trigger starts the job, stores its id and listens for events", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ jobID: "job-1" }));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));

    await act(async () => {
      await result.current.trigger();
    });

    expect(result.current.state.phase).toBe("running");
    expect(localStorage.getItem("jobID:artist-images")).toBe("job-1");
    expect(lastSource().url).toBe("/api/jobs/job-1/events");
  });

  it("feeds stream events into the job state", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ jobID: "job-1" }));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));
    await act(async () => {
      await result.current.trigger();
    });

    act(() => lastSource().emit("fetching", progressPayload(1, 4)));
    expect(result.current.state.currentPhase).toBe("fetching");

    act(() => lastSource().emit("progress", progressPayload(1, 4)));
    expect(result.current.state.currentPhase).toBe("processing");
    expect(result.current.state.index).toBe(1);
    expect(result.current.state.total).toBe(4);

    act(() => lastSource().emit("same", progressPayload(2, 4)));
    act(() => lastSource().emit("changed", progressPayload(3, 4)));
    act(() => lastSource().emit("failed", progressPayload(4, 4)));

    expect(result.current.state.results.same).toHaveLength(1);
    expect(result.current.state.results.changed).toHaveLength(1);
    expect(result.current.state.results.errors).toHaveLength(1);
  });

  it("done completes the job, clears the stored id and closes the stream", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ jobID: "job-1" }));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));
    await act(async () => {
      await result.current.trigger();
    });

    act(() => lastSource().emit("done"));

    expect(result.current.state.phase).toBe("complete");
    expect(localStorage.getItem("jobID:artist-images")).toBeNull();
    expect(lastSource().readyState).toBe(FakeEventSource.CLOSED);
  });

  it("a fatal stream error clears the job and resets", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ jobID: "job-1" }));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));
    await act(async () => {
      await result.current.trigger();
    });

    const source = lastSource();
    source.readyState = FakeEventSource.CLOSED;
    act(() => source.onerror?.());

    expect(result.current.state.phase).toBe("idle");
    expect(localStorage.getItem("jobID:artist-images")).toBeNull();
  });

  it("a failed trigger resets instead of hanging in running", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ message: "nope" }, false, 500));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));

    await act(async () => {
      await result.current.trigger();
    });

    expect(result.current.state.phase).toBe("idle");
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it("reattaches to a stored job on mount", async () => {
    localStorage.setItem("jobID:artist-images", "job-9");

    renderHook(() => useJobProgress({ job: "artist-images" }));

    await waitFor(() => {
      expect(lastSource()?.url).toBe("/api/jobs/job-9/events");
    });
    expect(imagesPost).not.toHaveBeenCalled();
  });

  it("reset stops listening and clears everything", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ jobID: "job-1" }));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));
    await act(async () => {
      await result.current.trigger();
    });

    act(() => result.current.reset());

    expect(result.current.state.phase).toBe("idle");
    expect(localStorage.getItem("jobID:artist-images")).toBeNull();
    expect(lastSource().readyState).toBe(FakeEventSource.CLOSED);
  });

  it("dismiss flags the state without stopping the job", async () => {
    imagesPost.mockResolvedValue(jsonResponse({ jobID: "job-1" }));
    const { result } = renderHook(() => useJobProgress({ job: "artist-images" }));
    await act(async () => {
      await result.current.trigger();
    });

    act(() => result.current.dismiss());

    expect(result.current.state.dismissed).toBe(true);
    expect(result.current.state.phase).toBe("running");
  });
});
