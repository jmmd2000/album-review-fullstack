import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const COUNT_DURATION_IN_MILLISECONDS = 1500;

function easeOutQuart(progress: number): number {
  return 1 - Math.pow(1 - progress, 4);
}

/**
 * Counts a whole number towards its target, easing out. When the target changes, it counts on from wherever it is.
 * Under reduced motion it jumps straight to the target.
 *
 * @param target The number to end on.
 * @param start The number to show first. Pass the target to show it straight away.
 * @returns The number to show now.
 */
export function useCountUp(target: number, start: number): number {
  const [shown, setShown] = useState(start);
  const shownRef = useRef(start);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;

    const duration = prefersReducedMotion() ? 0 : COUNT_DURATION_IN_MILLISECONDS;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = duration === 0 ? 1 : Math.min((now - startedAt) / duration, 1);
      const value = Math.round(from + (target - from) * easeOutQuart(progress));
      shownRef.current = value;
      setShown(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}
