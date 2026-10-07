import { test, expect } from "@playwright/test";
import { loginAsAdmin, openAdminMenu } from "../helpers";

test("admin links and pages are locked when logged out", async ({ page }) => {
  await page.goto("/");
  await openAdminMenu(page, page.getByLabel("Password"));
  await expect(page.getByRole("link", { name: "Review an album" })).toHaveCount(0);

  await page.goto("/settings");
  await expect(page.getByText("Log in to see this page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings" })).toHaveCount(0);
});

test("logging in unlocks the admin area and logging out locks it again", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();

  await openAdminMenu(page, page.getByRole("button", { name: "Log out" }));
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page.getByText("Log in to see this page")).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByText("Log in to see this page")).toBeVisible();
});
