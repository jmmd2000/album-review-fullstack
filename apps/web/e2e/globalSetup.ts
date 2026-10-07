import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { e2eEnvironment } from "./environment";

/**
 * Brings the e2e database up to date, then wipes and reseeds it, so every run starts from the same library.
 * The API scripts read DATABASE_URL_TEST when NODE_ENV is test, so they only ever touch the e2e database.
 */
export default function globalSetup() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  execSync("pnpm --filter @album-reviews/api run db:reset", {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "test", DATABASE_URL_TEST: e2eEnvironment.DATABASE_URL_TEST_E2E },
  });
}
