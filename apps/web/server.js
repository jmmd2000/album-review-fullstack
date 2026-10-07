import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { z } from "zod";
import start from "./dist/server/server.js";

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  // Server rendering reaches the api here, so a missing one would send every request to localhost
  API_ORIGIN: z.url(),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error("Invalid environment variables:", z.flattenError(parsedEnvironment.error).fieldErrors);
  process.exit(1);
}

const port = parsedEnvironment.data.PORT;

const app = new Hono();

app.use(compress());

app.use(async (context, next) => {
  await next();
  context.header("X-Content-Type-Options", "nosniff");
  context.header("Referrer-Policy", "strict-origin-when-cross-origin");
  context.header("X-Frame-Options", "DENY");
});

// Hashed bundles never change, so they cache for a year. A missing bundle
// must 404 rather than fall through to the document pretending to be js
app.use(
  "/assets/*",
  serveStatic({
    root: "./dist/client",
    onFound: (_path, context) => context.header("Cache-Control", "public, max-age=31536000, immutable"),
  })
);
app.all("/assets/*", context => context.text("Not Found", 404));

// Root-level public files, the favicon
app.use(serveStatic({ root: "./dist/client" }));

// Everything else renders through the start server bundle. The document
// revalidates on every visit so a new deploy shows up immediately
app.all("*", async context => {
  const response = await start.fetch(context.req.raw);
  if (response.headers.get("Content-Type")?.includes("text/html")) {
    const withHeaders = new Response(response.body, response);
    withHeaders.headers.set("Cache-Control", "no-cache");
    return withHeaders;
  }
  return response;
});

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, info => {
  console.log(`web listening on ${info.address}:${info.port}`);
});
