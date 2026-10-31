import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as prices } from "../prices.js";
import { calledUrls, fakePriceApis, hoursAgo, memoryStore } from "./fake-prices.js";
import { cheapest, priceRows, type PriceRow } from "./prices.js";

vi.mock("./price-store.js", async () => {
  const { memoryStore } = await import("./fake-prices.js");
  return { priceStore: () => memoryStore() };
});

const row = (game_slug: string, itad_id: string | null, checked_at: string): PriceRow => ({
  game_slug,
  itad_id,
  offers: itad_id
    ? [{ store: "Steam", url: "https://itad.link/old", price: 19.99, regularPrice: 19.99 }]
    : [],
  lowest: null,
  checked_at,
});

beforeEach(() => {
  process.env.RAWG_API_KEY = "rawg-key";
  process.env.ITAD_API_KEY = "itad-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("priceRows", () => {
  it("looks up a new game through its Steam page and saves it", async () => {
    fakePriceApis();
    const store = memoryStore();
    const hk = (await priceRows(["hollow-knight"], store)).get("hollow-knight");
    expect(hk).toMatchObject({
      itad_id: "hk",
      offers: [{ store: "GOG", price: 9.99 }, { store: "Steam" }],
      lowest: { price: 2.99, date: "2024-04-11" },
    });
    expect(store.rows.get("hollow-knight")).toEqual(hk);
  });

  it("answers from the database while prices are fresh", async () => {
    const fetch = fakePriceApis();
    const store = memoryStore([row("hollow-knight", "hk", hoursAgo(1))]);
    expect((await priceRows(["hollow-knight"], store)).get("hollow-knight")?.offers[0].price).toBe(19.99);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes stale prices without asking RAWG again", async () => {
    const fetch = fakePriceApis();
    const store = memoryStore([row("hollow-knight", "hk", hoursAgo(13))]);
    expect((await priceRows(["hollow-knight"], store)).get("hollow-knight")?.offers[0].price).toBe(9.99);
    expect(calledUrls(fetch).some((url) => url.startsWith("api.rawg.io"))).toBe(false);
  });

  it("finds PC games without a Steam page by their title", async () => {
    fakePriceApis();
    const aw2 = (await priceRows(["alan-wake-2"], memoryStore())).get("alan-wake-2");
    expect(aw2).toMatchObject({ itad_id: "aw2", offers: [{ store: "Epic Game Store", price: 29.99 }] });
  });

  it("saves console games as missing without matching them by title", async () => {
    const fetch = fakePriceApis();
    const ghost = (await priceRows(["ghost-of-yotei"], memoryStore())).get("ghost-of-yotei");
    expect(ghost).toMatchObject({ itad_id: null, offers: [] });
    expect(calledUrls(fetch)).not.toContain("api.isthereanydeal.com/lookup/id/title/v1");
  });

  it("checks a missing game again only after a week", async () => {
    const fetch = fakePriceApis();
    await priceRows(["ghost-of-yotei"], memoryStore([row("ghost-of-yotei", null, hoursAgo(24))]));
    expect(fetch).not.toHaveBeenCalled();
    await priceRows(["ghost-of-yotei"], memoryStore([row("ghost-of-yotei", null, hoursAgo(24 * 8))]));
    expect(fetch).toHaveBeenCalled();
  });

  it("doesn't save games RAWG doesn't know", async () => {
    fakePriceApis();
    const store = memoryStore();
    const rows = await priceRows(["no-such-game", "hollow-knight"], store);
    expect(rows.has("no-such-game")).toBe(false);
    expect(store.rows.has("no-such-game")).toBe(false);
    expect(store.rows.has("hollow-knight")).toBe(true);
  });

  it("uses a Steam id the caller already knows instead of asking RAWG", async () => {
    const fetch = fakePriceApis();
    await priceRows(["hollow-knight"], memoryStore(), { "hollow-knight": "367520" });
    expect(calledUrls(fetch).some((url) => url.startsWith("api.rawg.io"))).toBe(false);
  });

  it("treats a slug named like an object property as a normal game", async () => {
    const fetch = fakePriceApis();
    const rows = await priceRows(["constructor", "hollow-knight"], memoryStore());
    expect(rows.get("hollow-knight")?.itad_id).toBe("hk");
    const bodies = fetch.mock.calls.map(([, init]) => String(init?.body ?? ""));
    expect(bodies.some((body) => body.includes("function"))).toBe(false);
  });

  it("still refreshes stale prices when looking up a new game fails", async () => {
    fakePriceApis({ lookupDown: true });
    const store = memoryStore([row("hollow-knight", "hk", hoursAgo(13))]);
    const rows = await priceRows(["hollow-knight", "alan-wake-2"], store);
    expect(rows.get("hollow-knight")?.offers[0].price).toBe(9.99);
    expect(rows.has("alan-wake-2")).toBe(false);
  });

  it("keeps the old prices when IsThereAnyDeal is down", async () => {
    fakePriceApis({ itadDown: true });
    const store = memoryStore([row("hollow-knight", "hk", hoursAgo(13))]);
    expect((await priceRows(["hollow-knight"], store)).get("hollow-knight")?.offers[0].price).toBe(19.99);
    expect(store.write).not.toHaveBeenCalled();
  });
});

describe("/api/prices", () => {
  const call = (slugs: string) => prices(new Request(`http://localhost/api/prices?slugs=${slugs}`));

  it("answers each game with its cheapest offer and caches it for an hour", async () => {
    fakePriceApis();
    const response = await call("hollow-knight,ghost-of-yotei");
    expect(await response.json()).toEqual({
      "hollow-knight": { amount: 9.99, regular: 14.99, store: "GOG" },
      "ghost-of-yotei": null,
    });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
  });

  it("caches briefly when a game couldn't be looked up, so it's tried again soon", async () => {
    fakePriceApis();
    const response = await call("hollow-knight,no-such-game");
    expect(await response.json()).toMatchObject({ "no-such-game": null });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60,");
  });
});

describe("cheapest", () => {
  it("picks the first offer", () => {
    expect(cheapest(row("hollow-knight", "hk", hoursAgo(1)))).toEqual({
      amount: 19.99,
      regular: 19.99,
      store: "Steam",
    });
  });

  it("is null without offers", () => {
    expect(cheapest(row("ghost-of-yotei", null, hoursAgo(1)))).toBeNull();
    expect(cheapest(undefined)).toBeNull();
  });
});
