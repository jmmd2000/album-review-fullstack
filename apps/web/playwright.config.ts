import { defineConfig } from "@playwright/test";
import { E2E_API_PORT, E2E_WEB_PORT, e2eEnvironment } from "./e2e/environment";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  // Every spec shares one seeded database. The project dependencies keep the
  // read specs ahead of the mutating ones, and the mutating specs each own
  // their own fixture albums, so files can run in parallel within a project.
  workers: 4,
  projects: [
    { name: "setup", testDir: "./e2e", testMatch: "auth.setup.ts" },
    { name: "seeded-state", testDir: "./e2e/read" },
    { name: "mutations", testDir: "./e2e/mutations", dependencies: ["setup", "seeded-state"], use: { storageState: "e2e/.auth/admin.json" } },
  ],
  retries: 0,
  // One line of progress, then any failures in full
  reporter: "line",
  use: {
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    viewport: { width: 1920, height: 1080 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // e2e runs its own API and web server on the e2e database, and never reuses the dev servers.
  // Only their errors show, and a passing run has none.
  webServer: [
    {
      // Every run starts from the same library: the API resets the e2e database, then starts.
      // A failed reset stops the run here with its own error.
      command: "pnpm --silent --filter @album-reviews/api run db:reset && pnpm --filter @album-reviews/api exec tsx src/index.ts",
      url: `http://localhost:${E2E_API_PORT}/api/health`,
      reuseExistingServer: false,
      cwd: "../..",
      timeout: 60000,
      env: {
        PORT: String(E2E_API_PORT),
        NODE_ENV: "development",
        DATABASE_URL: e2eEnvironment.DATABASE_URL_TEST_E2E,
        CLIENT_ORIGIN: `http://localhost:${E2E_WEB_PORT}`,
        SCHEDULED_REFRESH: "false",
      },
    },
    {
      command: `pnpm --filter @album-reviews/web exec vite dev --port ${E2E_WEB_PORT} --strictPort`,
      // This checks the proxy to the API as well as Vite
      url: `http://localhost:${E2E_WEB_PORT}/api/health`,
      reuseExistingServer: false,
      cwd: "../..",
      timeout: 60000,
      env: { API_ORIGIN: `http://localhost:${E2E_API_PORT}` },
    },
  ],
});
