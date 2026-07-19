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
