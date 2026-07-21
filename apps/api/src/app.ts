import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { CORS_ORIGINS } from "@/config/cors";
import { AppError } from "@/api/middleware/errorHandler";
import { db, query, type Executor } from "@/db/client";

import auth from "@/api/routes/AuthRoutes";
import album from "@/api/routes/AlbumRoutes";
import track from "@/api/routes/TrackRoutes";
import artist from "@/api/routes/ArtistRoutes";

export const app = new Hono<{ Variables: { db: Executor } }>();

app.use("*", cors({ origin: CORS_ORIGINS, credentials: true }));
app.use("*", secureHeaders());

// Expose the db executor on the context so services can read c.var.db.
app.use("*", async (c, next) => {
  c.set("db", db);
  await next();
});

app.get("/api/health", async c => {
  try {
    await query("SELECT 1");
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

app.route("/api/auth", auth);
app.route("/api/albums", album);
app.route("/api/tracks", track);
app.route("/api/artists", artist);

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
