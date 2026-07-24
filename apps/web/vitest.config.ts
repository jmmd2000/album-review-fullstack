import { coverageConfigDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // The same globals the vite build defines.
  define: {
    __GIT_SHA__: JSON.stringify("test-web-sha"),
    __BUILT_AT__: JSON.stringify(""),
    __REACT_VERSION__: JSON.stringify("19.0.0-test"),
    __VITE_VERSION__: JSON.stringify("6.0.0-test"),
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Report every source file, not just the ones the tests import
      include: ["src/**/*.{ts,tsx}"],
      exclude: [...coverageConfigDefaults.exclude, "src/routeTree.gen.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
