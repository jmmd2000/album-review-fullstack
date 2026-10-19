import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { z } from "zod";
import start from "./dist/server/server.js";

function isDSN(value) {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return url.username !== "" && /^\/\d+$/.test(url.pathname);
}

// A blank line in .env counts as not set
const optional = schema => z.preprocess(value => (value === "" ? undefined : value), schema.optional());

const environmentSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    // Server rendering reaches the api here, so a missing one would send every request to localhost
    API_ORIGIN: z.url(),
    // Error reporting is off without a DSN. The start bundle reads both values itself.
    GLITCHTIP_DSN: optional(z.string().refine(isDSN, "Must be a DSN, such as https://<key>@<host>/<project id>")),
    GLITCHTIP_ENVIRONMENT: optional(z.string()),
  })
  .refine(environment => !environment.GLITCHTIP_DSN || environment.GLITCHTIP_ENVIRONMENT, {
    message: "Needed whenever GLITCHTIP_DSN is set, such as production or staging",
    path: ["GLITCHTIP_ENVIRONMENT"],
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

// The browser's error reporting reads its DSN and environment from here, so one image can serve staging and production.
// A DSN is public by design. This route must come before the static files, which have an "off" copy for dev.
app.get("/glitchtip-config.js", context => {
  const { GLITCHTIP_DSN: dsn, GLITCHTIP_ENVIRONMENT: environment } = parsedEnvironment.data;
  const config = dsn ? { dsn, environment } : null;
  context.header("Content-Type", "text/javascript");
  context.header("Cache-Control", "no-cache");
  return context.body(`window.__GLITCHTIP__ = ${JSON.stringify(config)};`);
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
