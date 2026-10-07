import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const environmentSchema = z.object({
  DATABASE_URL_TEST_E2E: z.url().refine(url => new URL(url).pathname.endsWith("_test_e2e"), "must point at a database whose name ends in _test_e2e"),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error("Invalid e2e environment variables:", z.flattenError(parsedEnvironment.error).fieldErrors);
  throw new Error("Invalid e2e environment variables. Check .env against .env.example.");
}

/** Environment variables for the e2e tests, checked once when this module loads. */
export const e2eEnvironment = parsedEnvironment.data;

/** The ports of the API and the web server that e2e runs for itself, away from the dev servers */
export const E2E_API_PORT = 4100;
export const E2E_WEB_PORT = 5180;
