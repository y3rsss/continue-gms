import type { LowestEver, StoreOffer } from "../../shared/types.js";
import { UpstreamError } from "./http.js";

const BASE_URL = "https://api.isthereanydeal.com/";
const STEAM_SHOP = 61;

interface Amount {
  amount: number;
}

interface ItadDeal {
  shop: { id: number; name: string };
  price: Amount;
  regular: Amount;
  url: string;
}

interface ItadPrices {
  id: string;
  deals: ItadDeal[];
}

interface ItadOverview {
  prices: { id: string; lowest: { price: Amount; timestamp: string } | null }[];
}

export interface Deals {
  offers: StoreOffer[];
  lowestEver: LowestEver | null;
}

async function itadFetch<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.ITAD_API_KEY;
  if (!key) throw new Error("ITAD_API_KEY is not set");

  const response = await fetch(new URL(path, BASE_URL), {
    method: "POST",
    headers: { "ITAD-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new UpstreamError("IsThereAnyDeal", response.status);
  return response.json() as Promise<T>;
}

export async function idsBySteamApp(appIds: string[]): Promise<Map<string, string | null>> {
  if (!appIds.length) return new Map();
  const found = await itadFetch<Record<string, string | null>>(
    `lookup/id/shop/${STEAM_SHOP}/v1`,
    appIds.map((id) => `app/${id}`),
  );
  return new Map(appIds.map((id) => [id, found[`app/${id}`] ?? null]));
}

export async function idsByTitle(titles: string[]): Promise<Map<string, string | null>> {
  if (!titles.length) return new Map();
  const found = await itadFetch<Record<string, string | null>>("lookup/id/title/v1", titles);
  return new Map(titles.map((title) => [title, found[title] ?? null]));
}

const toOffer = (deal: ItadDeal): StoreOffer => ({
  store: deal.shop.name,
  url: deal.url,
  price: deal.price.amount,
  regularPrice: deal.regular.amount,
});

export async function dealsFor(ids: string[]): Promise<Map<string, Deals>> {
  if (!ids.length) return new Map();
  const [prices, overview] = await Promise.all([
    itadFetch<ItadPrices[]>("games/prices/v3?country=US", ids),
    itadFetch<ItadOverview>("games/overview/v2?country=US", ids),
  ]);
  const lowest = new Map(overview.prices.map((game) => [game.id, game.lowest]));

  return new Map(
    prices.map((game) => {
      const offers = game.deals.map(toOffer).sort((a, b) => a.price! - b.price!);
      const low = lowest.get(game.id);
      const free = offers.length > 0 && offers[0].regularPrice === 0;
      return [
        game.id,
        {
          offers,
          lowestEver: low && !free ? { price: low.price.amount, date: low.timestamp.slice(0, 10) } : null,
        },
      ];
    }),
  );
}
