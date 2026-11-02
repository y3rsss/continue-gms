import type { Page } from "@playwright/test";
import { game } from "./mock";
import { FakeSupabase, PASSWORD, expect, test, type User } from "./supabase";

let user: User;

test.beforeEach(({ supabase }) => {
  user = supabase.addUser("yers");
});

const toast = (page: Page) => page.getByRole("status");
const saved = (supabase: FakeSupabase) => () =>
  supabase.entriesOf(user).map((e) => `${e.game_slug} ${e.status}`);

async function openGameSignedIn(page: Page, supabase: FakeSupabase) {
  await supabase.signInAs(page, user);
  await page.goto("/games/hollow-knight");
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
}

test("a stamp while signed in is saved to the account and stays after a reload", async ({
  page,
  supabase,
}) => {
  const friend = supabase.addUser("mika", { isPublic: true });
  supabase.addEntry(friend, "portal-2", "finished", Date.now());
  await openGameSignedIn(page, supabase);
  await page.getByRole("button", { name: "Playing", exact: true }).click();
  await expect.poll(saved(supabase)).toEqual(["hollow-knight playing"]);

  await page.goto("/backlog");
  await page.reload();
  await expect(page.getByRole("link", { name: /Hollow Knight/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "All 1", exact: true })).toBeVisible();
});

test("taking a stamp off removes it from the account", async ({ page, supabase }) => {
  await openGameSignedIn(page, supabase);
  const playing = page.getByRole("button", { name: "Playing", exact: true });
  await playing.click();
  await expect.poll(saved(supabase)).toEqual(["hollow-knight playing"]);

  await playing.click();
  await expect(playing).toHaveAttribute("aria-pressed", "false");
  await expect.poll(saved(supabase)).toEqual([]);
});

test("a failed save puts the stamp back and says so", async ({ page, supabase }) => {
  supabase.answer("POST", "/rest/v1/backlog_entries", 500, { code: "XX000", message: "Server down" });
  await openGameSignedIn(page, supabase);
  const playing = page.getByRole("button", { name: "Playing", exact: true });
  await playing.click();
  await expect(toast(page)).toHaveText("Couldn't save that change. Check your connection.");
  await expect(playing).toHaveAttribute("aria-pressed", "false");
});

test("guest games move to the account on sign in, and the newer copy wins", async ({ page, supabase }) => {
  const now = Date.now();
  supabase.addEntry(user, "portal-2", "playing", now - 60_000);
  const guest = {
    "the-witcher-3-wild-hunt": { status: "want", game: game("the-witcher-3-wild-hunt"), updatedAt: now },
    "portal-2": { status: "finished", game: game("portal-2"), updatedAt: now - 3_600_000 },
  };
  await page.addInitScript((data) => {
    if (sessionStorage.getItem("guest-seeded")) return;
    sessionStorage.setItem("guest-seeded", "1");
    localStorage.setItem("continue.backlog", data);
  }, JSON.stringify(guest));

  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill("yers@example.com");
  await dialog.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await dialog.getByRole("button", { name: "Sign in" }).click();

  await expect(toast(page)).toHaveText("Saved 1 game to your account.");
  expect(saved(supabase)().sort()).toEqual(["portal-2 playing", "the-witcher-3-wild-hunt want"]);
  expect(await page.evaluate(() => localStorage.getItem("continue.backlog"))).toBeNull();

  await page.goto("/backlog");
  await expect(page.getByRole("button", { name: "Want to play 1", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Playing 1", exact: true })).toBeVisible();
});

test("signing out leaves the account's games behind", async ({ page, supabase }) => {
  supabase.addEntry(user, "the-witcher-3-wild-hunt", "want", Date.now());
  await supabase.signInAs(page, user);
  await page.goto("/backlog");
  await expect(page.getByRole("link", { name: /The Witcher 3/ })).toBeVisible();

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(toast(page)).toHaveText("Signed out.");
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("continue.backlog.account"))).toBeNull();
});
