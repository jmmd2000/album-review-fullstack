import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["./src/__tests__/vitest.setup.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
