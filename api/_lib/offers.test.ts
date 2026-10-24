import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeFetch } from "./fake-fetch.js";
import { whereToBuy } from "./offers.js";

const rawgStores = {
  count: 3,
  next: null,
  results: [
    { store_id: 6, url: "https://www.nintendo.com/games/detail/hollow-knight-switch" },
    { store_id: 1, url: "http://store.steampowered.com/app/367520/" },
    { store_id: 5, url: "http://www.gog.com/game/hollow_knight" },
  ],
};

const cheapsharkGame = {
  cheapestPriceEver: { price: "2.99", date: 1712840581 },
  deals: [
    { storeID: "1", dealID: "steam-deal", price: "14.99", retailPrice: "14.99" },
    { storeID: "7", dealID: "gog-deal", price: "9.99", retailPrice: "14.99" },
    { storeID: "11", dealID: "humble%3D", price: "12.49", retailPrice: "14.99" },
    { storeID: "999", dealID: "closed-store", price: "1.00", retailPrice: "14.99" },
  ],
};

function fakeApis({ cheapsharkDown = false, stores = rawgStores } = {}) {
  return fakeFetch((url) => {
    if (url.hostname === "api.rawg.io") return stores;
    if (cheapsharkDown) return new Response("down", { status: 503 });
    if (url.searchParams.get("steamAppID") === "367520") return [{ gameID: "165363" }];
    if (url.searchParams.get("id") === "165363") return cheapsharkGame;
    return undefined;
  });
}

beforeEach(() => {
  process.env.RAWG_API_KEY = "test-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("whereToBuy", () => {
  it("puts CheapShark prices on RAWG's own store links", async () => {
    fakeApis();
    const { offers } = await whereToBuy("hollow-knight");
    const steam = offers.find((offer) => offer.store === "Steam");
    expect(steam).toEqual({
      store: "Steam",
      url: "https://store.steampowered.com/app/367520/",
      price: 14.99,
      regularPrice: 14.99,
    });
  });

  it("adds stores RAWG doesn't list, linking to their deal", async () => {
    fakeApis();
    const { offers } = await whereToBuy("hollow-knight");
    const humble = offers.find((offer) => offer.store === "Humble Store");
    expect(humble?.url).toBe("https://www.cheapshark.com/redirect?dealID=humble%3D");
    expect(humble?.price).toBe(12.49);
  });

  it("skips deals from stores it doesn't know", async () => {
    fakeApis();
    const { offers } = await whereToBuy("hollow-knight");
    expect(offers.some((offer) => offer.price === 1)).toBe(false);
  });

  it("sorts the cheapest offer first and stores without prices last", async () => {
    fakeApis();
    const { offers } = await whereToBuy("hollow-knight");
    expect(offers.map((offer) => offer.store)).toEqual(["GOG", "Humble Store", "Steam", "Nintendo eShop"]);
  });

  it("reports the lowest price ever with its date", async () => {
    fakeApis();
    const { lowestEver } = await whereToBuy("hollow-knight");
    expect(lowestEver).toEqual({ price: 2.99, date: "2024-04-11" });
  });

  it("still lists the store links when CheapShark is down", async () => {
    fakeApis({ cheapsharkDown: true });
    const { offers, lowestEver } = await whereToBuy("hollow-knight");
    expect(offers).toHaveLength(3);
    expect(offers.every((offer) => offer.price === null)).toBe(true);
    expect(lowestEver).toBeNull();
  });

  it("doesn't ask CheapShark about games without a Steam page", async () => {
    const fetch = fakeApis({ stores: { count: 1, next: null, results: [rawgStores.results[0]] } });
    await whereToBuy("zelda");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
