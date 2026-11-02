import { test as base, type Page, type Route } from "@playwright/test";
import type { Enums, Json, Tables } from "../src/lib/database.types";
import { game, mockApi } from "./mock";

export { expect } from "@playwright/test";

const PROJECT = "wcbhxfauynpsxltxyhja";
const STORAGE_KEY = `sb-${PROJECT}-auth-token`;
const USERNAME = /^[a-z0-9_]{3,24}$/;
export const PASSWORD = "Correct-horse-1";

export interface User {
  id: string;
  email: string;
  password: string;
  confirmed: boolean;
}

export interface Email {
  kind: "signup" | "resend" | "reset";
  email: string;
  redirectTo: string | null;
}

type Profile = Tables<"profiles">;
type Entry = Tables<"backlog_entries">;

interface Answer {
  status: number;
  body?: unknown;
}

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

const tokenFor = (user: User) =>
  [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated" }),
    "signature",
  ].join(".");

const authError = (status: number, code: string, msg: string): Answer => ({
  status,
  body: { code, error_code: code, msg },
});

const dbError = (status: number, code: string, message: string): Answer => ({
  status,
  body: { code, message, details: null, hint: null },
});

const eq = (url: URL, column: string) => url.searchParams.get(column)?.replace(/^eq\./, "");

const columns = (url: URL) =>
  (url.searchParams.get("select") ?? "")
    .replace(/\w+\([^)]*\)/g, "")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

const pick = (row: object, names: string[]) =>
  Object.fromEntries(names.map((name) => [name, (row as Record<string, unknown>)[name]]));

export class FakeSupabase {
  users: User[] = [];
  profiles: Profile[] = [];
  entries: Entry[] = [];
  emails: Email[] = [];
  providers = { google: true, github: true, email: true };
  private overrides = new Map<string, Answer>();
  private nextId = 1;
  private signedIn = false;

  addUser(username: string, options: { isPublic?: boolean; confirmed?: boolean; email?: string } = {}) {
    if (this.profiles.some((p) => p.username === username)) throw new Error(`${username} already exists`);
    const user: User = {
      id: `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`,
      email: options.email ?? `${username}@example.com`,
      password: PASSWORD,
      confirmed: options.confirmed ?? true,
    };
    this.users.push(user);
    this.profiles.push({
      id: user.id,
      username,
      display_name: username[0].toUpperCase() + username.slice(1),
      avatar_url: null,
      is_public: options.isPublic ?? false,
      created_at: "2026-10-25T00:00:00Z",
    });
    return user;
  }

  addEntry(
    user: User,
    slug: string,
    status: Enums<"backlog_status">,
    updatedAt: number,
    gameJson: Json = game(slug) as unknown as Json,
  ) {
    this.entries.push({
      user_id: user.id,
      game_slug: slug,
      status,
      game: gameJson,
      updated_at: new Date(updatedAt).toISOString(),
    });
  }

  profileOf(user: User) {
    return this.profiles.find((p) => p.id === user.id);
  }

  entriesOf(user: User) {
    return this.entries.filter((e) => e.user_id === user.id);
  }

  answer(method: string, path: string, status: number, body?: unknown) {
    this.overrides.set(`${method} ${path}`, { status, body });
  }

  async signInAs(page: Page, user: User) {
    if (this.signedIn)
      throw new Error("signInAs runs once per test, the session is seeded on the first load");
    this.signedIn = true;
    await page.addInitScript(
      ([key, value]) => {
        if (sessionStorage.getItem("seeded")) return;
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem(key, value);
      },
      [STORAGE_KEY, JSON.stringify(this.session(user))],
    );
  }

  async install(page: Page) {
    await page.route(`https://${PROJECT}.supabase.co/**`, (route) => this.handle(route));
  }

  private session(user: User) {
    return {
      access_token: tokenFor(user),
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `refresh-${user.id}`,
      user: this.userJson(user),
    };
  }

  private userJson(user: User) {
    return {
      id: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      email_confirmed_at: user.confirmed ? "2026-10-25T00:00:00Z" : null,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-10-25T00:00:00Z",
    };
  }

  private viewer(route: Route) {
    const token = route
      .request()
      .headers()
      .authorization?.replace(/^Bearer /, "");
    return this.users.find((user) => token === tokenFor(user)) ?? null;
  }

  private async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const override = this.overrides.get(`${request.method()} ${url.pathname}`);
    const answer = override ?? this.respond(request.method(), url, request.postDataJSON(), route);
    await route.fulfill({
      status: answer.status,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
      },
      body: answer.body === undefined ? "" : JSON.stringify(answer.body),
    });
  }

  private respond(method: string, url: URL, body: unknown, route: Route): Answer {
    const viewer = this.viewer(route);
    const redirectTo = url.searchParams.get("redirect_to");
    const { email } = (body ?? {}) as { email?: string };
    if (method === "OPTIONS") return { status: 204 };

    switch (`${method} ${url.pathname}`) {
      case "GET /auth/v1/settings":
        return { status: 200, body: { external: this.providers } };
      case "POST /auth/v1/token":
        return this.token(url, body as Record<string, string>);
      case "POST /auth/v1/signup":
        return this.signUp(body as { email: string; password: string }, redirectTo);
      case "POST /auth/v1/resend":
        this.emails.push({ kind: "resend", email: email!, redirectTo });
        return { status: 200, body: {} };
      case "POST /auth/v1/recover":
        this.emails.push({ kind: "reset", email: email!, redirectTo });
        return { status: 200, body: {} };
      case "POST /auth/v1/logout":
        return { status: 204 };
      case "GET /auth/v1/user":
        return viewer ? { status: 200, body: this.userJson(viewer) } : authError(401, "no_authorization", "");
      case "PUT /auth/v1/user":
        return viewer
          ? this.updateUser(viewer, body as { password?: string })
          : authError(401, "no_authorization", "");
      case "GET /rest/v1/profiles":
        return this.selectProfiles(viewer, url, route);
      case "PATCH /rest/v1/profiles":
        return this.updateProfile(viewer, url, body as Partial<Profile>, route);
      case "GET /rest/v1/backlog_entries": {
        const userId = eq(url, "user_id");
        const rows = this.visibleEntries(viewer).filter((e) => !userId || e.user_id === userId);
        return { status: 200, body: rows.map((e) => pick(e, columns(url))) };
      }
      case "POST /rest/v1/backlog_entries":
        return this.upsertEntries(viewer, body as Entry | Entry[]);
      case "DELETE /rest/v1/backlog_entries":
        return this.deleteEntry(viewer, url);
      case "POST /rest/v1/rpc/username_available": {
        if (!viewer) return dbError(401, "42501", "permission denied for function username_available");
        const name = (body as { name: string }).name.toLowerCase();
        return { status: 200, body: !this.profiles.some((p) => p.username === name) };
      }
      case "POST /rest/v1/rpc/delete_account":
        if (!viewer) return dbError(401, "42501", "permission denied for function delete_account");
        this.users = this.users.filter((u) => u.id !== viewer.id);
        this.profiles = this.profiles.filter((p) => p.id !== viewer.id);
        this.entries = this.entries.filter((e) => e.user_id !== viewer.id);
        return { status: 204 };
      default:
        return dbError(501, "PGRST000", `Not faked: ${method} ${url.pathname}`);
    }
  }

  private token(url: URL, body: Record<string, string>): Answer {
    const user =
      url.searchParams.get("grant_type") === "refresh_token"
        ? this.users.find((u) => body.refresh_token === `refresh-${u.id}`)
        : this.users.find((u) => u.email === body.email && u.password === body.password);
    if (!user) return authError(400, "invalid_credentials", "Invalid login credentials");
    if (!user.confirmed) return authError(400, "email_not_confirmed", "Email not confirmed");
    return { status: 200, body: this.session(user) };
  }

  private signUp(
    { email, password }: { email: string; password: string },
    redirectTo: string | null,
  ): Answer {
    const existing = this.users.find((u) => u.email === email);
    if (existing) return { status: 200, body: this.userJson(existing) };
    const cleaned = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    const base = cleaned.length >= 3 ? cleaned : "player";
    let username = base;
    for (let n = 1; this.profiles.some((p) => p.username === username); n++) username = `${base}${n}`;
    const user = this.addUser(username, { email, confirmed: false });
    user.password = password;
    this.emails.push({ kind: "signup", email, redirectTo });
    return { status: 200, body: this.userJson(user) };
  }

  private updateUser(viewer: User, { password }: { password?: string }): Answer {
    if (password === viewer.password) return authError(422, "same_password", "Same password");
    if (password) viewer.password = password;
    return { status: 200, body: this.userJson(viewer) };
  }

  private visibleProfiles(viewer: User | null) {
    return this.profiles.filter((p) => p.is_public || p.id === viewer?.id);
  }

  private visibleEntries(viewer: User | null) {
    const owners = new Set(this.visibleProfiles(viewer).map((p) => p.id));
    return this.entries.filter((e) => owners.has(e.user_id));
  }

  private rows(rows: object[], route: Route): Answer {
    if (!route.request().headers().accept?.includes("vnd.pgrst.object+json"))
      return { status: 200, body: rows };
    if (rows.length !== 1)
      return dbError(406, "PGRST116", "JSON object requested, multiple (or no) rows returned");
    return { status: 200, body: rows[0] };
  }

  private selectProfiles(viewer: User | null, url: URL, route: Route): Answer {
    const embedded = url.searchParams
      .get("select")
      ?.match(/backlog_entries\(([^)]*)\)/)?.[1]
      .split(",");
    const id = eq(url, "id");
    const username = eq(url, "username");
    const found = this.visibleProfiles(viewer).filter(
      (p) => (!id || p.id === id) && (!username || p.username === username),
    );
    const entries = this.visibleEntries(viewer);
    return this.rows(
      found.map((profile) => ({
        ...pick(profile, columns(url)),
        ...(embedded && {
          backlog_entries: entries
            .filter((e) => e.user_id === profile.id)
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
            .map((e) =>
              pick(
                e,
                embedded.map((name) => name.trim()),
              ),
            ),
        }),
      })),
      route,
    );
  }

  private updateProfile(viewer: User | null, url: URL, changes: Partial<Profile>, route: Route): Answer {
    const profile = this.profiles.find((p) => p.id === eq(url, "id") && p.id === viewer?.id);
    if (!profile) return this.rows([], route);
    const { username, display_name } = changes;
    if (username !== undefined && !USERNAME.test(username)) {
      return dbError(400, "23514", 'new row violates check constraint "profiles_username_check"');
    }
    if (username !== undefined && this.profiles.some((p) => p.username === username && p.id !== profile.id)) {
      return dbError(409, "23505", 'duplicate key value violates unique constraint "profiles_username_key"');
    }
    if (display_name !== undefined && (display_name.length < 1 || display_name.length > 50)) {
      return dbError(400, "23514", 'new row violates check constraint "profiles_display_name_check"');
    }
    Object.assign(profile, changes);
    return columns(url).length ? this.rows([pick(profile, columns(url))], route) : { status: 204 };
  }

  private upsertEntries(viewer: User | null, body: Entry | Entry[]): Answer {
    const rows = Array.isArray(body) ? body : [body];
    if (!viewer || rows.some((row) => row.user_id !== viewer.id)) {
      return dbError(403, "42501", 'new row violates row-level security policy for table "backlog_entries"');
    }
    for (const row of rows) {
      this.entries = this.entries.filter(
        (e) => !(e.user_id === row.user_id && e.game_slug === row.game_slug),
      );
      this.entries.push(row);
    }
    return { status: 201 };
  }

  private deleteEntry(viewer: User | null, url: URL): Answer {
    const userId = eq(url, "user_id");
    const slug = eq(url, "game_slug");
    if (viewer && userId === viewer.id) {
      this.entries = this.entries.filter((e) => !(e.user_id === userId && e.game_slug === slug));
    }
    return { status: 204 };
  }
}

export const test = base.extend<{ supabase: FakeSupabase }>({
  supabase: [
    async ({ page }, provide) => {
      const supabase = new FakeSupabase();
      await mockApi(page);
      await supabase.install(page);
      await provide(supabase);
    },
    { auto: true },
  ],
});
