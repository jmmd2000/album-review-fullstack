import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountUp } from "../useCountUp";

// Fake timers drive both performance.now and requestAnimationFrame, so the
// animation can be stepped deterministically.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountUp", () => {
  it("starts at zero", () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(0);
  });

  it("counts part of the way through the duration", () => {
    const { result } = renderHook(() => useCountUp(100, 1000));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it("lands exactly on the target once the duration has passed", () => {
    const { result } = renderHook(() => useCountUp(100, 1000));

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current).toBe(100);
  });

  it("stays on the target after the animation is done", () => {
    const { result } = renderHook(() => useCountUp(42, 500));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(42);
  });
});
