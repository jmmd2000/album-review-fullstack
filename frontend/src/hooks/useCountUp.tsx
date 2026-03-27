import { useEffect, useState } from "react";

export const useCountUp = (target: number, duration = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [target, duration]);

  return count;
};
