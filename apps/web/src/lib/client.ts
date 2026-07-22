import { hc } from "hono/client";
import type { AppType } from "@album-reviews/api";

// Typed RPC client. Paths, params, bodies and responses are all inferred from
// the backend's AppType, so a renamed route or changed response is a compile error.
export const client = hc<AppType>("/", { init: { credentials: "include" } });
