import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { CORS_ORIGINS } from "@/config/cors";
import { AppError } from "@/api/AppError";
import { db, query, type Executor } from "@/db/client";

import auth from "@/api/routes/AuthRoutes";
import album from "@/api/routes/AlbumRoutes";
import track from "@/api/routes/TrackRoutes";
import artist from "@/api/routes/ArtistRoutes";
import bookmark from "@/api/routes/BookmarkedAlbumRoutes";
import stats from "@/api/routes/StatsRoutes";
import settings from "@/api/routes/SettingsRoutes";
import spotify from "@/api/routes/SpotifyRoutes";
import test from "@/api/routes/TestRoutes";
import job from "@/api/routes/JobRoutes";

const base = new Hono<{ Variables: { db: Executor } }>();

base.use("*", cors({ origin: CORS_ORIGINS, credentials: true }));
base.use("*", secureHeaders());

// Expose the db executor on the context so services can read c.var.db.
base.use("*", async (c, next) => {
  c.set("db", db);
  await next();
});

// Routes are chained so their types accumulate into AppType for the RPC client.
export const app = base
  .get("/api/health", async c => {
    try {
      await query("SELECT 1");
      return c.json({ ok: true });
    } catch {
      return c.json({ ok: false }, 503);
    }
  })
  .route("/api/auth", auth)
  .route("/api/albums", album)
  .route("/api/tracks", track)
  .route("/api/artists", artist)
  .route("/api/bookmarks", bookmark)
  .route("/api/stats", stats)
  .route("/api/settings", settings)
  .route("/api/spotify", spotify)
  .route("/api/jobs", job);

export type AppType = typeof app;

// Dev/test only, kept off AppType (the frontend never calls it).
if (process.env.NODE_ENV !== "production") {
  app.route("/api/test", test);
}

// HTTPExceptions and AppErrors carry their own status and a safe message.
// Anything else is logged in full and returns a generic 500 so internals never reach the client.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  if (err instanceof AppError) {
    if (err.status >= 500) {
      console.error(err);
    } else {
      console.error(`${err.status}: ${err.message}`);
    }
    return c.json({ message: err.message }, err.status as ContentfulStatusCode);
  }
  console.error(err);
  return c.json({ message: "Internal server error" }, 500);
});
