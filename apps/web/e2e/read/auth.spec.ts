import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers";

test("admin nav and pages are locked when logged out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Search" })).toHaveCount(0);

  // The settings loader needs admin, so the page content never appears
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toHaveCount(0);
});

test("logging in unlocks the admin area and logging out locks it again", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByTestId("admin-dropdown-desktop").getByTestId("admin-dropdown-button").click();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("link", { name: "Search" })).toHaveCount(0);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toHaveCount(0);
});
