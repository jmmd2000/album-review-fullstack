import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function requireSecret(key: string, minLength: number): string {
  const value = requireEnv(key);
  if (value.length < minLength) {
    throw new Error(`Environment variable ${key} must be at least ${minLength} characters long`);
  }
  return value;
}

function optionalFlag(key: string): boolean {
  const value = process.env[key];
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  throw new Error(`Environment variable ${key} must be "true" or "false"`);
}

function optionalPort(key: string, fallback: number): number {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Environment variable ${key} must be a port number`);
  }
  return port;
}

export const env = {
  // e2e runs its own API on a spare port
  PORT: optionalPort("PORT", 4000),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  ADMIN_PASSWORD_HASH: requireEnv("ADMIN_PASSWORD_HASH"),
  JWT_SECRET: requireSecret("JWT_SECRET", 32),
  SPOTIFY_CLIENT_ID: requireEnv("SPOTIFY_CLIENT_ID"),
  SPOTIFY_CLIENT_SECRET: requireEnv("SPOTIFY_CLIENT_SECRET"),
  // comma-separated production/staging origins, injected per environment.
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  // Browserless sidecar for the header scraper.
  BROWSERLESS_URL: process.env.BROWSERLESS_URL ?? "ws://localhost:3000",
  BROWSERLESS_TOKEN: process.env.BROWSERLESS_TOKEN ?? "dev-token",
  // Only production sets this. Staging restores the production database, so the settings table can't keep it off there.
  SCHEDULED_REFRESH: optionalFlag("SCHEDULED_REFRESH"),
};
