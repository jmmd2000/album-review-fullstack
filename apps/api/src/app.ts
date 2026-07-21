import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import { CORS_ORIGINS } from "@/config/cors";
import { db, query, type Executor } from "@/db/client";

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

// HTTPExceptions have their own status and a safe message. Anything else is
// logged in full and returns a generic 500 so internals never reach the client.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: "Internal server error" }, 500);
});
