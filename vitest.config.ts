import path from "path";
import { configDefaults, coverageConfigDefaults, defineConfig } from "vitest/config";

const API_ROOT = path.resolve(import.meta.dirname, "apps/api");
const API_INTEGRATION_TESTS = "src/__tests__/**/*.integration.test.ts";

/** The settings the API's unit and integration projects share. The API package is CommonJS, so they live here and not in an ESM config inside it. */
const apiProject = {
  root: API_ROOT,
  resolve: {
    alias: {
      "@": path.resolve(API_ROOT, "src"),
      "@shared": path.resolve(import.meta.dirname, "packages/shared/src"),
    },
  },
};

const apiTest = {
  expect: { requireAssertions: true },
  environment: "node",
  testTimeout: 30000,
  setupFiles: ["./src/__tests__/vitest.setup.ts"],
};

/**
 * Runs every package's tests as projects of one run, so each suite prints one summary.
 * The API tests split in two: the unit project needs nothing running, and the integration project needs the test database.
 */
export default defineConfig({
  test: {
    // Passing tests print as dots, and failures print in full
    reporters: ["dot"],
    // Turns off the tips about faster settings that Vitest adds to the summary
    experimental: { diagnostics: { environment: false, import: false, isolate: false, transform: false } },
    // Each integration worker gets its own copy of the test database, and apps/api/src/__tests__/globalSetup.ts makes 8
    maxWorkers: 8,
    projects: [
      "packages/shared/vitest.config.ts",
      "apps/web/vitest.config.ts",
      {
        ...apiProject,
        test: {
          ...apiTest,
          name: "api-unit",
          include: ["src/__tests__/**/*.test.ts"],
          exclude: [...configDefaults.exclude, API_INTEGRATION_TESTS],
        },
      },
      {
        ...apiProject,
        test: {
          ...apiTest,
          name: "api-integration",
          include: [API_INTEGRATION_TESTS],
          globalSetup: ["./src/__tests__/globalSetup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Report every source file, not just the ones the tests import
      include: ["apps/api/src/**/*.ts", "apps/web/src/**/*.{ts,tsx}", "packages/shared/src/**/*.ts"],
      exclude: [...coverageConfigDefaults.exclude, "apps/api/src/db/fixtures/**", "apps/web/src/routeTree.gen.ts"],
    },
  },
});
