import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8");

function fixtureFor(url: URL): string | null {
  switch (url.pathname) {
    case "/api/games": {
      const list = url.searchParams.get("list");
      if (list) return list;
      return url.searchParams.get("size") === "1" ? "total" : "games";
    }
    case "/api/game":
      return "game";
    case "/api/stores":
      return "stores";
    case "/api/prices":
      return "prices";
    case "/api/genres":
      return "genres";
    case "/api/platforms":
      return "platforms";
    case "/api/search":
      return "search";
    default:
      return null;
  }
}

// answers /api with recorded responses and blocks other sites, so tests don't depend on RAWG
export async function mockApi(page: Page) {
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
  await page.route("**/api/**", (route) => {
    const name = fixtureFor(new URL(route.request().url()));
    return name
      ? route.fulfill({ contentType: "application/json", body: fixture(name) })
      : route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"Not mocked"}' });
  });
}
