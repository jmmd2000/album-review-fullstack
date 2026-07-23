import "dotenv/config";
import { Client } from "pg";

// Must match maxWorkers in vitest.config.ts
const WORKER_COUNT = 4;

/**
 * Creates one copy of the test database per vitest worker, cloned from the
 * template the db:push:test flow maintains, so test files can run concurrently.
 * The copies are dropped on teardown.
 */
export default async function globalSetup() {
  const templateURL = process.env.DATABASE_URL_TEST;
  if (!templateURL) {
    throw new Error("DATABASE_URL_TEST must be set to run the suite");
  }

  const templateName = new URL(templateURL).pathname.slice(1);

  // Database create and drop can't run while connected to the database in
  // question, so the admin connection goes through the postgres database
  const adminURL = new URL(templateURL);
  adminURL.pathname = "/postgres";

  const admin = new Client({ connectionString: adminURL.toString() });
  await admin.connect();
  for (let workerID = 1; workerID <= WORKER_COUNT; workerID++) {
    const name = `${templateName}_w${workerID}`;
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.query(`CREATE DATABASE "${name}" TEMPLATE "${templateName}"`);
  }
  await admin.end();

  return async () => {
    const teardown = new Client({ connectionString: adminURL.toString() });
    await teardown.connect();
    for (let workerID = 1; workerID <= WORKER_COUNT; workerID++) {
      await teardown.query(`DROP DATABASE IF EXISTS "${templateName}_w${workerID}" WITH (FORCE)`);
    }
    await teardown.end();
  };
}
