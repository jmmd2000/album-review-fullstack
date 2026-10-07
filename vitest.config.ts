import { configDefaults, coverageConfigDefaults, defineConfig } from "vitest/config";

const API_INTEGRATION_TESTS = "src/__tests__/**/*.integration.test.ts";

/**
 * Runs every package's tests as projects of one run, so each suite prints one summary.
 * The API tests split in two: the unit project needs nothing running, and the integration project needs the test database.
 */
export default defineConfig({
  test: {
    // Passing tests print as dots, and failures print in full
    reporters: ["dot"],
    // Each integration worker gets its own copy of the test database, and apps/api/src/__tests__/globalSetup.ts makes 8
    maxWorkers: 8,
    projects: [
      "packages/shared/vitest.config.ts",
      "apps/web/vitest.config.ts",
      {
        extends: "./apps/api/vitest.config.ts",
        root: "./apps/api",
        test: {
          name: "api-unit",
          include: ["src/__tests__/**/*.test.ts"],
          exclude: [...configDefaults.exclude, API_INTEGRATION_TESTS],
        },
      },
      {
        extends: "./apps/api/vitest.config.ts",
        root: "./apps/api",
        test: {
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
