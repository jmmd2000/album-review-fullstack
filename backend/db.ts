import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const closeDatabase = async () => {
  await pool.end();
  console.log("Database connection closed.");
};

export default pool;
