import { env } from "@/config/env";

// Local dev origins
const developmentOrigins = ["http://localhost:5173", "http://localhost:8080"];

// Production and staging origins are injected via CLIENT_ORIGIN, comma-separated, https only.
const configuredOrigins = env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(",")
      .map(origin => origin.trim())
      .filter(Boolean)
  : [];

export const CORS_ORIGINS = [...configuredOrigins, ...(process.env.NODE_ENV === "production" ? [] : developmentOrigins)];

/** The site's own address, for links to its pages: the first configured origin, or the dev server locally */
export const SITE_ORIGIN = configuredOrigins[0] ?? developmentOrigins[0];
