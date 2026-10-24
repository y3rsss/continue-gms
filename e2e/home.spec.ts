import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
});

test("shows the cover story and the game rows", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 2, name: "Valheim" })).toBeVisible();
  await expect(page.getByText("901,281 video games")).toBeVisible();
  for (const row of ["Trending now", "New and notable", "All-time greats"]) {
    await expect(page.getByRole("heading", { name: row })).toBeVisible();
  }
});

test("a teaser opens the index with its filters", async ({ page }) => {
  await page.getByRole("link", { name: /The best RPGs, ranked/ }).click();
  await expect(page).toHaveURL(/\/games\?genre=role-playing-games-rpg&sort=metascore/);
  await expect(page.getByRole("link", { name: /Grand Theft Auto V/ }).first()).toBeVisible();
});
