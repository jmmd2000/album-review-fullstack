import { Pool } from "pg";
import dotenv from "dotenv";
import { resolveDatabaseURL } from "@/config/database";

dotenv.config();

const pool = new Pool({
  connectionString: resolveDatabaseURL(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = (text: string, params?: any[]) => pool.query(text, params);

export const closeDatabase = async () => {
  await pool.end();
};

export default pool;
