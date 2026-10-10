/** Tells whether the visitor has asked for less motion. Only call it in the browser. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
