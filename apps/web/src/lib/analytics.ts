import type { Theme } from "@/lib/theme";

/** The events the site sends to Umami, and the data each one carries. */
interface AnalyticsEvents {
  "home-search": { query: string; result: "album" | "artist" | "none" };
  "not-found": { path: string; kind: string };
  "theme-toggle": { theme: Theme };
  "score-explainer-open": undefined;
  "tracks-show-all": undefined;
}

interface UmamiTracker {
  track: (eventName: string, eventData?: Record<string, string>) => void;
}

declare global {
  interface Window {
    /** Set by the Umami script. It is missing when the script is blocked, has not loaded yet, or is not on this domain. */
    umami?: UmamiTracker;
  }
}

/** The local storage item that tells the Umami script to ignore this browser. */
const UMAMI_DISABLED_KEY = "umami.disabled";

/**
 * Sends an event to Umami. It does nothing when the Umami script is missing,
 * and an error from the script never reaches the page.
 *
 * @param name The event name
 * @param data The data the event carries
 */
export function trackEvent<Name extends keyof AnalyticsEvents>(name: Name, data?: AnalyticsEvents[Name]): void {
  try {
    window.umami?.track(name, data);
  } catch {
    // Tracking must never break the page
  }
}

/** Tells the Umami script to ignore this browser from now on, so the admin's own visits do not count. */
export function ignoreThisBrowser(): void {
  try {
    localStorage.setItem(UMAMI_DISABLED_KEY, "1");
  } catch {
    // Storage can be blocked, and then the visit counts
  }
}
