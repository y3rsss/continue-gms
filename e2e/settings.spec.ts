import type { Page } from "@playwright/test";
import { FakeSupabase, PASSWORD, expect, test, type User } from "./supabase";

let user: User;

test.beforeEach(({ supabase }) => {
  user = supabase.addUser("yers");
});

const toast = (page: Page) => page.getByRole("status");

async function openSettings(page: Page, supabase: FakeSupabase) {
  await supabase.signInAs(page, user);
  await page.goto("/settings");
  await expect(page.getByText("yers@example.com")).toBeVisible();
}

test("signed out, settings asks you to sign in", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("Sign in to manage your account.")).toBeVisible();
});

test("the username is checked while typing and then saved", async ({ page, supabase }) => {
  supabase.addUser("mika");
  await openSettings(page, supabase);
  const username = page.getByLabel("Username");

  await username.fill("Mika");
  await expect(username).toHaveValue("mika");
  await expect(page.getByText("Taken", { exact: true })).toBeVisible();
  await username.fill("ab");
  await expect(page.getByText("3 to 24 characters")).toBeVisible();
  await username.fill("yers_2");
  await expect(page.getByText("Available")).toBeVisible();

  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(toast(page)).toHaveText("Profile saved.");
  expect(supabase.profileOf(user)?.username).toBe("yers_2");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menu")).toContainText("@yers_2");
});

test("a username taken in the meantime shows an error", async ({ page, supabase }) => {
  supabase.answer("PATCH", "/rest/v1/profiles", 409, { code: "23505", message: "duplicate key value" });
  await openSettings(page, supabase);
  await page.getByLabel("Username").fill("yers_2");
  await expect(page.getByText("Available")).toBeVisible();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("That username is taken.")).toBeVisible();
});

test("the display name can't be blank", async ({ page, supabase }) => {
  await openSettings(page, supabase);
  await page.getByLabel("Display name").fill("   ");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Add a display name.")).toBeVisible();
  expect(supabase.profileOf(user)?.display_name).toBe("Yers");
});

test("a new password has to be strong and different", async ({ page, supabase }) => {
  await openSettings(page, supabase);
  const password = page.getByLabel("New password");
  const save = page.getByRole("button", { name: "Save password" });

  await password.fill("abc");
  await save.click();
  await expect(page.getByText("Your password needs 8+ characters")).toBeVisible();
  await password.fill(PASSWORD);
  await save.click();
  await expect(page.getByText("That's your current password. Pick a new one.")).toBeVisible();

  await password.fill("Brand-new-pass-2");
  await save.click();
  await expect(toast(page)).toHaveText("Password saved.");
  expect(user.password).toBe("Brand-new-pass-2");
});

test("deleting the account needs the username, then signs you out", async ({ page, supabase }) => {
  supabase.addEntry(user, "portal-2", "finished", Date.now());
  await openSettings(page, supabase);
  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Delete my account" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type your username to confirm").fill("yer");
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type your username to confirm").fill("yers");
  await confirm.click();

  await expect(toast(page)).toHaveText("Account deleted.");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(supabase.users).toEqual([]);
  expect(supabase.profiles).toEqual([]);
  expect(supabase.entries).toEqual([]);
});
