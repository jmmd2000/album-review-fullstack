import { useEffect, useState } from "react";

// Module-wide, flips once the first client render has mounted
let hydrated = false;

/**
 * Whether the app was already hydrated when the calling component mounted.
 * False for everything in the server-rendered first page, true for anything
 * mounted after. Entrance animations pass initial={false} while this is
 * false, so server-rendered pages are visible without js and the entrance
 * only plays on client navigations. Latched per mount so re-renders never
 * restart an animation.
 */
export function useHydrated(): boolean {
  const [value] = useState(hydrated);
  useEffect(() => {
    hydrated = true;
  }, []);
  return value;
}
