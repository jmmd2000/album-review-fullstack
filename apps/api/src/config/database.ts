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

    // Each vitest worker gets its own copy of the test database, created by the
    // suite's global setup, so files can run in parallel without sharing state.
    // Outside vitest (seeding, wiping) the base test database is used as before.
    const workerID = process.env.VITEST_POOL_ID;
    if (workerID) {
      const url = new URL(testDatabaseUrl);
      url.pathname = `${url.pathname}_w${workerID}`;
      return url.toString();
    }

    return testDatabaseUrl;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  return databaseUrl;
};
