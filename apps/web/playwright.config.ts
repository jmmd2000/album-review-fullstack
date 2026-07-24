import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/globalSetup.ts",
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
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1920, height: 1080 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @album-reviews/api dev",
      url: "http://localhost:4000/api/health",
      reuseExistingServer: true,
      cwd: "../..",
      timeout: 60000,
    },
    {
      command: "pnpm --filter @album-reviews/web dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      cwd: "../..",
      timeout: 60000,
    },
  ],
});
