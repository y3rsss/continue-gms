import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calledUrls, fakePriceApis, memoryStore } from "./fake-prices.js";
import { whereToBuy } from "./offers.js";

beforeEach(() => {
  process.env.RAWG_API_KEY = "rawg-key";
  process.env.ITAD_API_KEY = "itad-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("whereToBuy", () => {
  it("lists priced PC stores cheapest first, then console stores without prices", async () => {
    fakePriceApis();
    const { offers } = await whereToBuy("hollow-knight", memoryStore());
    expect(offers).toEqual([
      { store: "GOG", url: "https://itad.link/gog", price: 9.99, regularPrice: 14.99 },
      { store: "Steam", url: "https://itad.link/steam", price: 14.99, regularPrice: 14.99 },
      {
        store: "Nintendo eShop",
        url: "https://www.nintendo.com/games/detail/hollow-knight-switch",
        price: null,
        regularPrice: null,
      },
      {
        store: "Epic Games Store",
        url: "https://store.epicgames.com/hollow-knight",
        price: null,
        regularPrice: null,
      },
    ]);
  });

  it("lists a store once when RAWG and IsThereAnyDeal spell it differently", async () => {
    fakePriceApis();
    const { offers } = await whereToBuy("alan-wake-2", memoryStore());
    expect(offers.map((offer) => offer.store)).toEqual(["Epic Game Store"]);
  });

  it("reports the lowest price ever with its date", async () => {
    fakePriceApis();
    expect((await whereToBuy("hollow-knight", memoryStore())).lowestEver).toEqual({
      price: 2.99,
      date: "2024-04-11",
    });
  });

  it("reuses RAWG's Steam link instead of looking it up again", async () => {
    const fetch = fakePriceApis();
    await whereToBuy("hollow-knight", memoryStore());
    expect(calledUrls(fetch).filter((url) => url.startsWith("api.rawg.io"))).toEqual([
      "api.rawg.io/api/games/hollow-knight/stores",
    ]);
  });

  it("keeps RAWG's links for games without PC prices", async () => {
    fakePriceApis();
    const { offers, lowestEver } = await whereToBuy("ghost-of-yotei", memoryStore());
    expect(offers).toEqual([
      {
        store: "PlayStation Store",
        url: "https://store.playstation.com/ghost",
        price: null,
        regularPrice: null,
      },
    ]);
    expect(lowestEver).toBeNull();
  });

  it("still lists the store links when prices can't be loaded", async () => {
    fakePriceApis();
    const store = memoryStore();
    store.read.mockRejectedValue(new Error("database down"));
    const { offers } = await whereToBuy("hollow-knight", store);
    expect(offers).toHaveLength(4);
    expect(offers.every((offer) => offer.price === null)).toBe(true);
  });
});
