import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/globalSetup.ts",
  timeout: 30000,
  fullyParallel: false,
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
