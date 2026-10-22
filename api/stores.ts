import type { StoreOffer, WhereToBuy } from "../shared/types.js";
import { findDeals, steamAppId, type Deals } from "./_lib/cheapshark.js";
import { SLUG, cacheFor, errorResponse } from "./_lib/http.js";
import { rawgFetch, toStoreOffer, type RawgList, type RawgStoreLink } from "./_lib/rawg.js";

async function dealsFor(offers: StoreOffer[]): Promise<Deals | null> {
  const steamId = offers.map((offer) => steamAppId(offer.url)).find((id) => id !== null);
  if (!steamId) return null;
  try {
    return await findDeals(steamId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function merge(offers: StoreOffer[], deals: StoreOffer[]): StoreOffer[] {
  const merged = offers.map((offer) => {
    const deal = deals.find((d) => d.store === offer.store);
    return deal ? { ...offer, price: deal.price, regularPrice: deal.regularPrice } : offer;
  });
  const extra = deals.filter((deal) => !offers.some((offer) => offer.store === deal.store));

  return [...merged, ...extra].sort((a, b) => {
    if (a.price === null) return b.price === null ? 0 : 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });
}

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) {
    return Response.json({ error: "Invalid game" }, { status: 400 });
  }

  try {
    const data = await rawgFetch<RawgList<RawgStoreLink>>(`games/${slug}/stores`);
    const offers = data.results.filter((link) => link.url).map(toStoreOffer);
    const deals = await dealsFor(offers);

    const body: WhereToBuy = {
      offers: merge(offers, deals?.offers ?? []),
      lowestEver: deals?.lowestEver ?? null,
    };
    return Response.json(body, { headers: cacheFor(60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
