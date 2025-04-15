import * as dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  out: "./drizzle",
  schema: isProd ? "./dist/backend/src/db/schema.js" : "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
