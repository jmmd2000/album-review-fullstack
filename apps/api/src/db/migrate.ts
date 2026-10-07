import "@/config/loadEnvironment";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDatabase, db } from "@/db/client";

// Applies the migrations in drizzle/ that haven't run yet. drizzle-kit migrate does the same, but hides the error when it fails.
const run = async () => {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  console.log("Migrate: done.");
  await closeDatabase();
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
