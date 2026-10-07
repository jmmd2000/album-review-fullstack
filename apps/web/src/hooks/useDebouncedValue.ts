import { useEffect, useState } from "react";

/**
 * Returns the value once it has stopped changing for the given time.
 * Useful for searching as the user types without a request on every key.
 */
export function useDebouncedValue<T>(value: T, delayInMilliseconds: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayInMilliseconds);
    return () => clearTimeout(timer);
  }, [value, delayInMilliseconds]);

  return debouncedValue;
}
