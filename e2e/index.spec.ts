import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/games");
  await expect(page.getByRole("link", { name: /Grand Theft Auto V/ }).first()).toBeVisible();
});

test("a genre tab filters the index through the URL", async ({ page }) => {
  await page.getByRole("button", { name: "Action", exact: true }).click();
  await expect(page).toHaveURL(/genre=action/);
  await expect(page.getByRole("button", { name: "Action", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the list or grid choice survives a reload", async ({ page }) => {
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Grid", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
