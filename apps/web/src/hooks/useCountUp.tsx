import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

export const useCountUp = (target: number, duration = 1000) => {
  // Server-rendered pages show the final number straight away, the count-up
  // only plays on client navigations
  const shouldAnimate = useHydrated();
  const [count, setCount] = useState(shouldAnimate ? 0 : target);

  useEffect(() => {
    if (!shouldAnimate) return;

    const startTime = performance.now();

    let frameID: number;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * target);
      setCount(current);
      if (progress < 1) {
        frameID = requestAnimationFrame(animate);
      }
    };

    frameID = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameID);
  }, [target, duration, shouldAnimate]);

  return count;
};
