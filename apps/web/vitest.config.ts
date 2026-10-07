import { defineConfig } from "vitest/config";
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
    name: "web",
    expect: { requireAssertions: true },
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@shared": path.resolve(import.meta.dirname, "../../packages/shared/src"),
    },
  },
});
