import { vi } from "vitest";
import { fakeFetch } from "./fake-fetch.js";
import type { PriceRow, PriceStore } from "./prices.js";

export const deal = (shop: string, price: number, regular: number) => ({
  shop: { id: 1, name: shop },
  price: { amount: price },
  regular: { amount: regular },
  url: `https://itad.link/${shop.toLowerCase().replace(/ /g, "-")}`,
});

const RAWG: Record<string, unknown> = {
  "games/hollow-knight/stores": {
    results: [
      { store_id: 6, url: "https://www.nintendo.com/games/detail/hollow-knight-switch" },
      { store_id: 1, url: "http://store.steampowered.com/app/367520/" },
      { store_id: 5, url: "http://www.gog.com/game/hollow_knight" },
      { store_id: 11, url: "https://store.epicgames.com/hollow-knight" },
    ],
  },
  "games/alan-wake-2/stores": { results: [{ store_id: 11, url: "https://store.epicgames.com/alan-wake-2" }] },
  "games/alan-wake-2": { name: "Alan Wake 2", parent_platforms: [{ platform: { slug: "pc" } }] },
  "games/ghost-of-yotei/stores": { results: [{ store_id: 3, url: "https://store.playstation.com/ghost" }] },
  "games/ghost-of-yotei": {
    name: "Ghost of Yotei",
    parent_platforms: [{ platform: { slug: "playstation" } }],
  },
};

const ITAD: Record<string, unknown> = {
  "/lookup/id/shop/61/v1": { "app/367520": "hk" },
  "/lookup/id/title/v1": { "Alan Wake 2": "aw2" },
  "/games/prices/v3": [
    { id: "hk", deals: [deal("Steam", 14.99, 14.99), deal("GOG", 9.99, 14.99)] },
    { id: "aw2", deals: [deal("Epic Game Store", 29.99, 49.99)] },
  ],
  "/games/overview/v2": {
    prices: [
      { id: "hk", lowest: { price: { amount: 2.99 }, timestamp: "2024-04-11T10:00:00+02:00" } },
      { id: "aw2", lowest: null },
    ],
  },
};

export function fakePriceApis({ itadDown = false, lookupDown = false } = {}) {
  return fakeFetch((url) => {
    if (url.hostname === "api.rawg.io") return RAWG[url.pathname.replace("/api/", "").replace(/\/$/, "")];
    if (itadDown || (lookupDown && url.pathname.startsWith("/lookup/")))
      return new Response("down", { status: 503 });
    return ITAD[url.pathname];
  });
}

export const calledUrls = (fetch: ReturnType<typeof fakeFetch>) =>
  fetch.mock.calls.map(([input]) => {
    const url = new URL(String(input));
    return url.hostname + url.pathname;
  });

export function memoryStore(initial: PriceRow[] = []) {
  const rows = new Map(initial.map((row) => [row.game_slug, row]));
  const store = {
    rows,
    read: vi.fn<PriceStore["read"]>(async (slugs) => slugs.flatMap((slug) => rows.get(slug) ?? [])),
    write: vi.fn<PriceStore["write"]>(async (fresh) => {
      for (const row of fresh) rows.set(row.game_slug, row);
    }),
  };
  return store;
}

export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
