/**
 * Resolves the Postgres connection URL for the current runtime environment.
 *
 * In test runs (`NODE_ENV=test`) this deliberately refuses to fall back to the
 * primary `DATABASE_URL`: a dedicated `DATABASE_URL_TEST` must be provided.
 *
 * @returns The connection string for the current environment.
 * @throws If the connection string required for the environment is missing.
 */
export const resolveDatabaseURL = (): string => {
  if (process.env.NODE_ENV === "test") {
    const testDatabaseUrl = process.env.DATABASE_URL_TEST;
    if (!testDatabaseUrl) {
      throw new Error('DATABASE_URL_TEST must be set when NODE_ENV is "test"');
    }
    return testDatabaseUrl;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  return databaseUrl;
};