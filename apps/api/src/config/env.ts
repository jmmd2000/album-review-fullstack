import "./loadEnvironment";

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

function isDSN(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return url.username !== "" && /^\/\d+$/.test(url.pathname);
}

function optionalDSN(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === "") return undefined;
  if (!isDSN(value)) throw new Error(`Environment variable ${key} must be a DSN, such as https://<key>@<host>/<project id>`);
  return value;
}

const glitchTipDSN = optionalDSN("GLITCHTIP_DSN");

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
  // Error reporting is off without a DSN. The environment names where events come from, such as production or staging.
  GLITCHTIP_DSN: glitchTipDSN,
  GLITCHTIP_ENVIRONMENT: glitchTipDSN ? requireEnv("GLITCHTIP_ENVIRONMENT") : undefined,
  // Baked into the image by the docker build, "dev" outside a built image
  GIT_SHA: process.env.GIT_SHA ?? "dev",
};
