import { randomUUID } from "crypto";
import { createMiddleware } from "hono/factory";
import { logger } from "@/config/logger";

/**
 * Logs one line per request with a request id, so an error logged anywhere
 * can be tied back to the request that caused it. The id is also returned as
 * an x-request-id header. Health checks are skipped, the container healthcheck
 * and the uptime pinger would otherwise drown the log in pings.
 */
export const requestLogger = createMiddleware<{ Variables: { requestID: string } }>(async (c, next) => {
  const requestID = randomUUID();
  c.set("requestID", requestID);
  c.header("x-request-id", requestID);

  const started = performance.now();
  await next();

  if (c.req.path === "/api/health") return;
  logger.info(
    {
      requestID,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - started),
    },
    `${c.req.method} ${c.req.path} ${c.res.status}`
  );
});
