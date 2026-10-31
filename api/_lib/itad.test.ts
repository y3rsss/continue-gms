import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeFetch } from "./fake-fetch.js";
import { deal } from "./fake-prices.js";
import { UpstreamError } from "./http.js";
import { dealsFor, idsBySteamApp, idsByTitle } from "./itad.js";

const answerDeals = (games: { id: string; deals: ReturnType<typeof deal>[] }[]) =>
  fakeFetch((url) =>
    url.pathname === "/games/prices/v3"
      ? games
      : {
          prices: games.map((game) => ({
            id: game.id,
            lowest: { price: { amount: 2.99 }, timestamp: "2024-04-11T10:00:00+02:00" },
          })),
        },
  );

beforeEach(() => {
  process.env.ITAD_API_KEY = "itad-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("idsBySteamApp", () => {
  it("sends the key and maps Steam app ids to IsThereAnyDeal ids", async () => {
    const fetch = fakeFetch((url, init) => {
      expect(url.pathname).toBe("/lookup/id/shop/61/v1");
      expect(JSON.parse(String(init?.body))).toEqual(["app/367520", "app/1"]);
      return { "app/367520": "hk", "app/1": null };
    });
    expect(await idsBySteamApp(["367520", "1"])).toEqual(
      new Map([
        ["367520", "hk"],
        ["1", null],
      ]),
    );
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ "ITAD-API-Key": "itad-key" });
  });

  it("doesn't call the api with nothing to look up", async () => {
    const fetch = fakeFetch(() => ({}));
    expect(await idsBySteamApp([])).toEqual(new Map());
    expect(await idsByTitle([])).toEqual(new Map());
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("dealsFor", () => {
  it("lists offers cheapest first with the record low and its date", async () => {
    answerDeals([{ id: "hk", deals: [deal("Steam", 14.99, 14.99), deal("Epic Game Store", 9.99, 14.99)] }]);
    expect((await dealsFor(["hk"])).get("hk")).toEqual({
      offers: [
        {
          store: "Epic Game Store",
          url: "https://itad.link/epic-game-store",
          price: 9.99,
          regularPrice: 14.99,
        },
        { store: "Steam", url: "https://itad.link/steam", price: 14.99, regularPrice: 14.99 },
      ],
      lowestEver: { price: 2.99, date: "2024-04-11" },
    });
  });

  it("drops the record low of a free to play game", async () => {
    answerDeals([{ id: "dota", deals: [deal("Steam", 0, 0)] }]);
    expect((await dealsFor(["dota"])).get("dota")?.lowestEver).toBeNull();
  });

  it("fails loudly when the api refuses", async () => {
    fakeFetch(() => new Response("slow down", { status: 429 }));
    await expect(dealsFor(["hk"])).rejects.toBeInstanceOf(UpstreamError);
  });
});
