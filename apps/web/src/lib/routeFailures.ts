import { ApiError } from "@/lib/client";

/** The part of a router match that this file reads. */
interface RouteMatch {
  routeId: string;
  status: string;
  error?: unknown;
}

export interface RouteFailure {
  routeId: string;
  error: unknown;
}

/**
 * Picks the routes whose loader failed in a way worth reporting. An ApiError is left out
 * because the API reports its own errors. Not found and redirects are not failures.
 */
export function routeFailuresToReport(matches: readonly RouteMatch[]): RouteFailure[] {
  return matches.filter(match => match.status === "error" && !(match.error instanceof ApiError)).map(match => ({ routeId: match.routeId, error: match.error }));
}
