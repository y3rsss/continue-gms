import type { StoreOffer } from "../../shared/types.js";
import { UpstreamError } from "./http.js";

const BASE_URL = "https://www.cheapshark.com/api/1.0/";
const USER_AGENT = "continue-gms/1.0 (+https://github.com/y3rsss/continue-gms)";

const STORES: Record<string, string> = {
  "1": "Steam",
  "2": "GamersGate",
  "3": "Green Man Gaming",
  "7": "GOG",
  "11": "Humble Store",
  "13": "Ubisoft Store",
  "15": "Fanatical",
  "21": "WinGameStore",
  "23": "GameBillet",
  "25": "Epic Games Store",
  "27": "Gamesplanet",
  "28": "Gamesload",
  "30": "IndieGala",
  "35": "DreamGame",
};

interface CheapsharkMatch {
  gameID: string;
}

interface CheapsharkGame {
  cheapestPriceEver?: { price: string; date: number };
  deals: { storeID: string; dealID: string; price: string; retailPrice: string }[];
}

export interface Deals {
  offers: StoreOffer[];
  lowestEver: { price: number; date: string } | null;
}

export async function cheapsharkFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new UpstreamError("CheapShark", response.status);
  return response.json() as Promise<T>;
}

export function steamAppId(url: string): string | null {
  const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
  return match ? match[1] : null;
}

export async function findDeals(steamId: string): Promise<Deals | null> {
  const [match] = await cheapsharkFetch<CheapsharkMatch[]>("games", { steamAppID: steamId });
  if (!match) return null;

  const game = await cheapsharkFetch<CheapsharkGame>("games", { id: match.gameID });
  const lowest = game.cheapestPriceEver;

  return {
    offers: game.deals
      .filter((deal) => deal.storeID in STORES)
      .map((deal) => ({
        store: STORES[deal.storeID],
        // dealID comes back already URL-encoded
        url: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
        price: Number(deal.price),
        regularPrice: Number(deal.retailPrice),
      })),
    lowestEver: lowest
      ? { price: Number(lowest.price), date: new Date(lowest.date * 1000).toISOString().slice(0, 10) }
      : null,
  };
}
