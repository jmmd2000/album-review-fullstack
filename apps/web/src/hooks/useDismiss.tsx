import { useEffect, useEffectEvent } from "react";
import type { RefObject } from "react";

/**
 * Close a popup when the user clicks outside the given element or presses Escape.
 * Shared by the dropdown-style controls so the dismissal behaviour stays consistent.
 * The latest onDismiss is always used, so callers do not need to memoise it.
 *
 * @param ref The wrapper element that should stay open while interacted with.
 * @param onDismiss Called when a click lands outside the wrapper or Escape is pressed.
 */
export function useDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void) {
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        dismiss();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref]);
}
