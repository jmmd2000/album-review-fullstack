import { defineConfig } from "tsup";

// Bundles the app with path aliases resolved at build time, node_modules stay
// external. The drizzle config and schema are separate entries so drizzle-kit
// can load them standalone at migrate time.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "drizzle.config": "drizzle.config.ts",
    "db/schema": "src/db/schema.ts",
  },
  format: "cjs",
  target: "node22",
  outDir: "dist",
  clean: true,
});
