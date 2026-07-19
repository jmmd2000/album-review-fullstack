import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "@/config/env";
import { resolveDatabaseURL } from "@/config/database";

export const pool = new Pool({ connectionString: resolveDatabaseURL() });

export const db = drizzle(pool);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = (text: string, params?: any[]) => pool.query(text, params);

export const closeDatabase = async () => {
  await pool.end();
};
