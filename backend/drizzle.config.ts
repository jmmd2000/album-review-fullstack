import * as dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";
// Relative import so drizzle-kit can load this config without a path-alias resolver
import { resolveDatabaseURL } from "./src/config/database";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  out: "./drizzle",
  schema: isProd ? "./dist/backend/src/db/schema.js" : "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseURL(),
  },
});
