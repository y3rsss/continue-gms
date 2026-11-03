import { expect, test } from "@playwright/test";
import { game, mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("the night edition stays on after a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Switch to night edition" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to day edition" })).toBeVisible();
});

test("an unknown page shows Game over", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  await expect(page.getByText("This page doesn't exist.")).toBeVisible();
  await page.getByRole("link", { name: "Continue? Yes, back to the cover" }).click();
  await expect(page).toHaveURL("/");
});

test("an unknown game says it can't be found", async ({ page }) => {
  await page.route("**/api/game?slug=missing-game", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"Game not found"}' }),
  );
  await page.goto("/games/missing-game");
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  await expect(page.getByText(/couldn't find that game/)).toBeVisible();
});

test("a provider failure is asked again once, then says so", async ({ page }) => {
  let asked = 0;
  await page.route("**/api/game?slug=hollow-knight", (route) => {
    asked++;
    return route.fulfill({
      status: 502,
      contentType: "application/json",
      body: '{"error":"Game data provider failed"}',
    });
  });
  await page.goto("/games/hollow-knight");
  await expect(page.getByText("Game data provider failed. Try again in a moment.")).toBeVisible();
  expect(asked).toBe(2);
});

test("a cover list that fails says so instead of loading forever", async ({ page }) => {
  await page.route(
    (url) => url.pathname === "/api/games" && url.searchParams.get("list") === "new",
    (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: '{"error":"Game data provider failed"}',
      }),
  );
  await page.goto("/");
  const fresh = page.locator("section", { has: page.getByRole("heading", { name: "New and notable" }) });
  await expect(fresh.getByText("Game data provider failed. Try again in a moment.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trending now" })).toBeVisible();
  await expect(
    page
      .locator("section", { has: page.getByRole("heading", { name: "Trending now" }) })
      .locator(".narrow")
      .first(),
  ).toBeVisible();
});

test.describe("a game in the backlog", () => {
  const witcher = game("the-witcher-3-wild-hunt");

  test.beforeEach(async ({ page }) => {
    const backlog = { [witcher.slug]: { status: "want", game: witcher, updatedAt: 1 } };
    await page.addInitScript(
      (data) => localStorage.setItem("continue.backlog", data),
      JSON.stringify(backlog),
    );
  });

  test("still opens with what the backlog saved when details fail", async ({ page }) => {
    await page.route(`**/api/game?slug=${witcher.slug}`, (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: '{"error":"Game data provider failed"}',
      }),
    );
    await page.goto(`/games/${witcher.slug}`);
    await expect(page.getByRole("status").filter({ hasText: "Showing what your backlog saved" })).toHaveText(
      "Couldn't load the full page. Showing what your backlog saved.",
    );
    await expect(page.getByRole("heading", { name: witcher.name })).toBeVisible();
    await expect(page.getByRole("button", { name: "Want to play", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page).toHaveTitle(`${witcher.name} | Continue?`);
  });

  test("still says it can't be found when RAWG doesn't know it", async ({ page }) => {
    await page.route(`**/api/game?slug=${witcher.slug}`, (route) =>
      route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"Game not found"}' }),
    );
    await page.goto(`/games/${witcher.slug}`);
    await expect(page.getByText(/couldn't find that game/)).toBeVisible();
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [name, path, ready] of [
    ["cover", "/", "Valheim"],
    ["index", "/games", "Grand Theft Auto V"],
    ["game page", "/games/hollow-knight", "Hollow Knight"],
    ["backlog", "/backlog", "Nothing here yet"],
  ]) {
    test(`the ${name} fits the screen without sideways scrolling`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(ready).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("search still opens from the menu bar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Search games/ }).click();
    await expect(page.getByRole("combobox")).toBeFocused();
  });
});
