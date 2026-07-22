import { hc } from "hono/client";
import type { AppType } from "@album-reviews/api";

/** Thrown when the API responds with a non-2xx. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Typed RPC client. Paths, params, bodies and responses are all inferred from
// the backend's AppType, so a renamed route or changed response is a compile error.
export const client = hc<AppType>("/", { init: { credentials: "include" } });

// hc responses are a union of one ClientResponse per status, the success ones
// have ok: true, so this picks out the success body.
type OkBody<R> = R extends { ok: true; json: () => Promise<infer T> } ? T : never;

type HcResponse = { ok: boolean; status: number; statusText: string; json: () => Promise<unknown> };

async function fail(res: HcResponse): Promise<never> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  throw new ApiError(body?.message ?? res.statusText, res.status);
}

/**
 * Awaits a client call and returns its typed JSON body. Throws an ApiError if
 * the response wasn't a 2xx. (The client itself never throws on error.)
 */
export async function handle<R extends HcResponse>(promise: Promise<R>): Promise<OkBody<R>> {
  const res = await promise;
  if (!res.ok) return fail(res);
  return res.json() as Promise<OkBody<R>>;
}

/** Same as handle() but for endpoints with no meaningful body (204s) */
export async function handleVoid(promise: Promise<HcResponse>): Promise<void> {
  const res = await promise;
  if (!res.ok) await fail(res);
}
