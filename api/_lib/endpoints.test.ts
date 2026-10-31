import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as game } from "../game.js";
import { GET as games } from "../games.js";
import { GET as prices } from "../prices.js";
import { GET as search } from "../search.js";
import { GET as stores } from "../stores.js";
import { fakeFetch } from "./fake-fetch.js";

const call = (endpoint: (request: Request) => Promise<Response>, path: string) =>
  endpoint(new Request(`http://localhost${path}`));

beforeEach(() => {
  process.env.RAWG_API_KEY = "test-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("input checks", () => {
  it.each([
    "/api/games?page=0",
    "/api/games?page=1.5",
    "/api/games?size=41",
    "/api/games?platform=atari",
    "/api/games?sort=cheapest",
    "/api/games?genre=../secret",
    "/api/games?list=everything",
  ])("rejects %s", async (path) => {
    const fetch = fakeFetch(() => ({}));
    const response = await call(games, path);
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [game, "/api/game"],
    [game, "/api/game?slug=Not%20A%20Slug!"],
    [stores, "/api/stores?slug=../../etc"],
    [prices, "/api/prices"],
    [prices, "/api/prices?slugs="],
    [prices, "/api/prices?slugs=hades,Not%20A%20Slug"],
    [prices, `/api/prices?slugs=${Array.from({ length: 41 }, (_, i) => `game-${i}`).join(",")}`],
    [search, "/api/search?q=x"],
    [search, `/api/search?q=${"a".repeat(61)}`],
  ])("rejects bad input to %o at %s", async (endpoint, path) => {
    fakeFetch(() => ({}));
    expect((await call(endpoint, path)).status).toBe(400);
  });
});

describe("responses", () => {
  it("returns 404 for a game RAWG doesn't know", async () => {
    fakeFetch(() => undefined);
    const response = await call(game, "/api/game?slug=nope-nope");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Game not found" });
  });

  it("returns 502 when RAWG itself fails", async () => {
    fakeFetch(() => new Response("oops", { status: 500 }));
    expect((await call(games, "/api/games")).status).toBe(502);
  });

  it("returns a page of games in the app's own format, cached on the CDN", async () => {
    fakeFetch(() => ({
      count: 30,
      next: "https://api.rawg.io/api/games?page=2",
      results: [
        {
          id: 1,
          slug: "hollow-knight",
          name: "Hollow Knight",
          background_image: null,
          released: "2017-02-23",
          metacritic: 87,
          rating: 4.4,
        },
      ],
    }));
    const response = await call(games, "/api/games?page=1");
    const body = await response.json();
    expect(body).toMatchObject({
      count: 30,
      nextPage: 2,
      results: [{ slug: "hollow-knight", metascore: 87 }],
    });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
  });
});
