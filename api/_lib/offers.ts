import type { StoreOffer, WhereToBuy } from "../../shared/types.js";
import { priceStore } from "./price-store.js";
import { priceRows, type PriceRow, type PriceStore } from "./prices.js";
import { rawgFetch, steamAppId, toStoreOffer, type RawgList, type RawgStoreLink } from "./rawg.js";

const storeKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/(games?)?store$/, "");

export async function whereToBuy(slug: string, store?: PriceStore): Promise<WhereToBuy> {
  const data = await rawgFetch<RawgList<RawgStoreLink>>(`games/${slug}/stores`);
  const links = data.results.filter((link) => link.url).map(toStoreOffer);
  const steamId = links.map((link) => steamAppId(link.url)).find((id) => id !== null) ?? null;

  let row: PriceRow | undefined;
  try {
    row = (await priceRows([slug], store ?? priceStore(), { [slug]: steamId })).get(slug);
  } catch (error) {
    console.error(error);
  }

  const priced: StoreOffer[] = row?.offers ?? [];
  const pricedStores = new Set(priced.map((offer) => storeKey(offer.store)));
  return {
    offers: [...priced, ...links.filter((link) => !pricedStores.has(storeKey(link.store)))],
    lowestEver: row?.lowest ?? null,
  };
}
