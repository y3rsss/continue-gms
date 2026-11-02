import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/games");
  await expect(page.getByRole("link", { name: /Grand Theft Auto V/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /The Witcher 3/ }).first()).toContainText("$9.99");
});

test("a genre tab filters the index through the URL", async ({ page }) => {
  await page.getByRole("button", { name: "Action", exact: true }).click();
  await expect(page).toHaveURL(/genre=action/);
  await expect(page.getByRole("button", { name: "Action", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("each game shows its best price, in the list and on the grid", async ({ page }) => {
  const witcher = page.getByRole("link", { name: /The Witcher 3/ }).first();
  await expect(witcher).toContainText("−75%");
  await expect(witcher).toContainText("$9.99");
  await expect(page.getByRole("link", { name: /Counter-Strike/ }).first()).toContainText("Free");

  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await expect(page.getByRole("link", { name: /The Witcher 3/ }).first()).toContainText("Best price $9.99");
});

test("games the server leaves out for now get their price on the next ask", async ({ page }) => {
  let asked = 0;
  await page.route("**/api/prices**", (route) => {
    asked++;
    const slugs = new URL(route.request().url()).searchParams.get("slugs")!.split(",");
    const price = { amount: 4.99, regular: 19.99, store: "Steam" };
    const body = Object.fromEntries(slugs.slice(0, 5).map((slug) => [slug, price]));
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.reload();
  await expect(page.getByRole("link", { name: /The Witcher 3/ }).first()).toContainText("$4.99");
  expect(asked).toBeGreaterThan(1);
});

test("stops asking when an answer has no prices at all", async ({ page }) => {
  let asked = 0;
  await page.route("**/api/prices**", (route) => {
    asked++;
    return route.fulfill({ contentType: "application/json", body: "{}" });
  });
  await page.reload();
  const witcher = page.getByRole("link", { name: /The Witcher 3/ }).first();
  await expect(witcher).toBeVisible();
  await page.waitForTimeout(1500);
  expect(asked).toBeLessThanOrEqual(2);
  await expect(witcher).not.toContainText("$");
});

test("the list or grid choice survives a reload", async ({ page }) => {
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Grid", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
