import { defineConfig } from "vitest/config";
import path from "path";

/** The settings the API's unit and integration projects share. The root vitest.config.ts picks each project's tests. */
export default defineConfig({
  test: {
    expect: { requireAssertions: true },
    environment: "node",
    testTimeout: 30000,
    setupFiles: ["./src/__tests__/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
