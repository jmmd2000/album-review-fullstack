import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isProduction = process.env.NODE_ENV === "production";
const schemaPath = isProduction ? "./dist/src/db/schema.js" : "./src/db/schema.ts";
console.log(process.env.DATABASE_URL);

export default defineConfig({
  out: "./drizzle",
  schema: schemaPath,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
