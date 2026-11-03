import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as game } from "../game.js";
import { GET as games } from "../games.js";
import { GET as prices } from "../prices.js";
import { GET as search } from "../search.js";
import { GET as stores } from "../stores.js";
import { fakeFetch } from "./fake-fetch.js";
import type { PriceRow } from "./prices.js";

const copies = vi.hoisted(() => new Map<string, unknown>());

vi.mock("./copy-store.js", () => ({
  copyStore: () => ({
    read: async (key: string) => copies.get(key) ?? null,
    save: async (key: string, body: unknown) => {
      copies.set(key, body);
    },
  }),
}));

const savedPrices = vi.hoisted((): PriceRow[] => []);

vi.mock("./price-store.js", async () => {
  const { memoryStore } = await import("./fake-prices.js");
  return { priceStore: () => memoryStore(savedPrices) };
});

const call = (endpoint: (request: Request) => Promise<Response>, path: string) =>
  endpoint(new Request(`http://localhost${path}`));

beforeEach(() => {
  copies.clear();
  savedPrices.length = 0;
  process.env.RAWG_API_KEY = "test-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
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
    "/api/games?sort=constructor",
    "/api/games?platform=constructor",
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

  it("returns 502 when RAWG doesn't answer within 8 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      (_: URL, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason)),
        ),
    );
    const response = call(games, "/api/games");
    await vi.advanceTimersByTimeAsync(8000);
    expect((await response).status).toBe(502);
  });

  it("returns 502 when RAWG can't be reached", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("fetch failed")));
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

describe("saved copies", () => {
  const rawgPage = {
    count: 1,
    next: null,
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
  };
  const rawgGame = (url: URL) =>
    /\/(screenshots|movies)$/.test(url.pathname)
      ? { results: [] }
      : { id: 1, slug: "portal-2", name: "Portal 2", background_image: null, genres: [] };
  const rawgDown = () => fakeFetch(() => new Response("down", { status: 522 }));

  it("serves the last good answer while RAWG is down, cached for a minute", async () => {
    fakeFetch(() => rawgPage);
    const good = await (await call(games, "/api/games?list=trending&size=13")).json();
    rawgDown();
    const response = await call(games, "/api/games?list=trending&size=13");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(good);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60,");
  });

  it("still says a game doesn't exist instead of serving an old copy", async () => {
    fakeFetch(rawgGame);
    expect((await call(game, "/api/game?slug=portal-2")).status).toBe(200);
    fakeFetch(() => undefined);
    expect((await call(game, "/api/game?slug=portal-2")).status).toBe(404);
  });

  it("saves one copy for the same query however it's written", async () => {
    fakeFetch(() => rawgPage);
    await call(games, "/api/games?list=trending&size=13&x=1");
    await call(games, "/api/games?size=13&list=trending");
    expect(copies.size).toBe(1);
    rawgDown();
    expect((await call(games, "/api/games?list=trending&size=13&sort=relevance")).status).toBe(200);
  });

  it("where to buy falls back to the saved prices while RAWG is down, cached for a minute", async () => {
    const gog = { store: "GOG", url: "https://itad.link/gog", price: 9.99, regularPrice: 14.99 };
    savedPrices.push({
      game_slug: "hollow-knight",
      itad_id: "hk",
      offers: [gog],
      lowest: null,
      checked_at: new Date().toISOString(),
    });
    rawgDown();
    const response = await call(stores, "/api/stores?slug=hollow-knight");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ offers: [gog], lowestEver: null });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60,");
  });

  it("doesn't save search results", async () => {
    fakeFetch(() => rawgPage);
    expect((await call(games, "/api/games?search=hollow")).status).toBe(200);
    expect(copies.size).toBe(0);
  });
});
