import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    expect: { requireAssertions: true },
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Report every source file, not just the ones the tests import
      include: ["src/**/*.ts"],
    },
  },
});
