import dotenv from "dotenv";

dotenv.config();

// Force the test environment regardless of what .env contains, so the database
// resolver and the resetTables guard both treat this unambiguously as a test run.
process.env.NODE_ENV = "test";