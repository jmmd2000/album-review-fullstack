import path from "path";
import * as dotenv from "dotenv";
// The one .env at the repo root. Production gets its env from compose, so there's no file to find there.
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

import { defineConfig } from "drizzle-kit";
// Relative import so drizzle-kit can load this config without a path-alias resolver
import { resolveDatabaseURL } from "./src/config/database";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  out: "./drizzle",
  schema: isProd ? "./dist/db/schema.js" : "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseURL(),
  },
});
