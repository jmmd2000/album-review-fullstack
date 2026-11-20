import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { APP_VERSION } from "@/config/appVersion";
import { CORS_ORIGINS } from "@/config/cors";
import { logger } from "@/config/logger";
import { reportError } from "@/config/errorReporting";
import { AppError } from "@/api/AppError";
import { requestLogger } from "@/api/middleware/requestLogger";
import { db, query, type Executor } from "@/db/client";

import auth from "@/api/routes/AuthRoutes";
import album from "@/api/routes/AlbumRoutes";
import track from "@/api/routes/TrackRoutes";
import artist from "@/api/routes/ArtistRoutes";
import bookmark from "@/api/routes/BookmarkedAlbumRoutes";
import stats from "@/api/routes/StatsRoutes";
import home from "@/api/routes/HomeRoutes";
import settings from "@/api/routes/SettingsRoutes";
import spotify from "@/api/routes/SpotifyRoutes";
import job from "@/api/routes/JobRoutes";
import drafts from "@/api/routes/ReviewDraftRoutes";
import discover from "@/api/routes/DiscoverRoutes";
import listening from "@/api/routes/ListeningRoutes";

const base = new Hono<{ Variables: { db: Executor; requestID: string } }>();

base.use("*", requestLogger);
base.use("*", cors({ origin: CORS_ORIGINS, credentials: true }));
base.use("*", secureHeaders());

// Expose the db executor on the context so services can read c.var.db.
base.use("*", async (c, next) => {
  c.set("db", db);
  await next();
});

// Routes are chained so their types accumulate into AppType for the RPC client.
export const app = base
  // Public, so it gives the build and nothing more. The deploy and the uptime checks ask it
  .get("/api/health", async c => {
    const build = { version: APP_VERSION, gitSHA: process.env.GIT_SHA ?? "dev", builtAt: process.env.BUILT_AT || null };
    try {
      await query("SELECT 1");
      return c.json({ status: "ok", ...build }, 200);
    } catch (error) {
      logger.error({ err: error }, "Health check failed: the database can't be reached");
      return c.json({ status: "unhealthy", ...build }, 503);
    }
  })
  .route("/api/auth", auth)
  .route("/api/albums", album)
  .route("/api/tracks", track)
  .route("/api/artists", artist)
  .route("/api/bookmarks", bookmark)
  .route("/api/stats", stats)
  .route("/api/home", home)
  .route("/api/settings", settings)
  .route("/api/spotify", spotify)
  .route("/api/jobs", job)
  .route("/api/drafts", drafts)
  .route("/api/discover", discover)
  .route("/api/listening", listening);

export type AppType = typeof app;

// HTTPExceptions and AppErrors carry their own status and a safe message.
// Anything else is logged in full and returns a generic 500 so internals never reach the client.
app.onError((err, c) => {
  const requestID = c.get("requestID");
  const request = { requestID, method: c.req.method, path: c.req.path };
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ requestID, err }, err.message);
      reportError(err, request);
    } else {
      logger.warn({ requestID }, `${err.status}: ${err.message}`);
    }
    return c.json({ message: err.message }, err.status as ContentfulStatusCode);
  }
  logger.error({ requestID, err }, "Unhandled error");
  reportError(err, request);
  return c.json({ message: "Internal server error" }, 500);
});
