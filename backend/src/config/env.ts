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

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  ADMIN_PASSWORD_HASH: requireEnv("ADMIN_PASSWORD_HASH"),
  JWT_SECRET: requireSecret("JWT_SECRET", 32),
  SPOTIFY_CLIENT_ID: requireEnv("SPOTIFY_CLIENT_ID"),
  SPOTIFY_CLIENT_SECRET: requireEnv("SPOTIFY_CLIENT_SECRET"),
};
