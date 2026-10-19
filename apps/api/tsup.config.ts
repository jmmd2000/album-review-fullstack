import { defineConfig } from "tsup";

// Bundles the app with path aliases resolved at build time, node_modules stay
// external. The drizzle config and schema are separate entries so drizzle-kit
// can load them standalone at migrate time.
export default defineConfig({
  entry: {
    // GlitchTip can match a third-party file called index.js to this bundle's map, so the bundle has a name of its own
    "albums-api": "src/index.ts",
    "drizzle.config": "drizzle.config.ts",
    "db/schema": "src/db/schema.ts",
  },
  format: "cjs",
  target: "node26",
  outDir: "dist",
  clean: true,
  // The build step in the Dockerfile uploads the maps and then deletes them.
  sourcemap: true,
});
