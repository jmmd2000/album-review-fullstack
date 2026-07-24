import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Fake timers drive both performance.now and requestAnimationFrame, so the
// animation can be stepped deterministically.
beforeEach(() => {
  vi.useFakeTimers();
  // The hydration latch lives in module state, so every test starts from a
  // fresh, not yet hydrated module graph
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
});

async function importHooks() {
  const { useCountUp } = await import("@/hooks/useCountUp");
  const { useHydrated } = await import("@/hooks/useHydrated");
  return { useCountUp, useHydrated };
}

/** Mounts and unmounts a throwaway hook so the module counts as hydrated. */
function markHydrated(useHydrated: () => boolean) {
  renderHook(() => useHydrated()).unmount();
}

describe("useCountUp", () => {
  it("shows the target immediately on the server-rendered first mount", async () => {
    const { useCountUp } = await importHooks();

    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(100);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(100);
  });

  it("starts at zero on mounts after hydration", async () => {
    const { useCountUp, useHydrated } = await importHooks();
    markHydrated(useHydrated);

    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(0);
  });

  it("counts part of the way through the duration", async () => {
    const { useCountUp, useHydrated } = await importHooks();
    markHydrated(useHydrated);

    const { result } = renderHook(() => useCountUp(100, 1000));
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it("lands exactly on the target once the duration has passed", async () => {
    const { useCountUp, useHydrated } = await importHooks();
    markHydrated(useHydrated);

    const { result } = renderHook(() => useCountUp(100, 1000));
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current).toBe(100);
  });

  it("stays on the target after the animation is done", async () => {
    const { useCountUp, useHydrated } = await importHooks();
    markHydrated(useHydrated);

    const { result } = renderHook(() => useCountUp(42, 500));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(42);
  });
});
