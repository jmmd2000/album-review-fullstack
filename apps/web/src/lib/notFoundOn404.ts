import { notFound } from "@tanstack/react-router";
import { ApiError } from "@/lib/client";

/**
 * Waits for a loader's data, and turns an API 404 into the router's not found.
 * The router then shows the route's notFoundComponent, and the server answers with a 404 status.
 * An ApiError thrown on the server reaches the browser as a plain error, so a 404 left as an ApiError would show as "Something went wrong" once the page hydrates.
 */
export async function notFoundOn404<T>(load: Promise<T>): Promise<T> {
  try {
    return await load;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) throw notFound();
    throw error;
  }
}
