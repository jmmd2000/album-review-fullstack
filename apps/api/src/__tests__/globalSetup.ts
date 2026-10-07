import "@/config/loadEnvironment";
import { execSync } from "child_process";
import path from "path";
import { Client } from "pg";
import { assertTestDatabase } from "@/db/databaseSafety";

// Must match maxWorkers in the root vitest.config.ts
const WORKER_COUNT = 8;

const API_ROOT = path.resolve(__dirname, "../..");

/**
 * Brings the test database up to date with the migrations, then creates one copy
 * of it per vitest worker, so test files can run concurrently.
 * The copies are dropped on teardown.
 */
export default async function globalSetup() {
  const templateURL = process.env.DATABASE_URL_TEST;
  assertTestDatabase(templateURL);

  // drizzle.config.ts picks DATABASE_URL_TEST when NODE_ENV is test and no worker ID is set
  const migrateEnvironment: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "test" };
  delete migrateEnvironment.VITEST_POOL_ID;
  execSync("pnpm exec drizzle-kit migrate", { cwd: API_ROOT, env: migrateEnvironment, stdio: "pipe" });

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
