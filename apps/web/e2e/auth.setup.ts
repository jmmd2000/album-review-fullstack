import path from "path";
import { fileURLToPath } from "url";
import { test as setup } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// Logs in once per run and saves the session for the mutation specs
setup("save an admin session", async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".auth/admin.json") });
});
