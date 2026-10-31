import type { LowestEver, Price, StoreOffer } from "../../shared/types.js";
import { UpstreamError } from "./http.js";
import { dealsFor, idsBySteamApp, idsByTitle } from "./itad.js";
import { rawgFetch, steamAppId, type RawgGameDetails, type RawgList, type RawgStoreLink } from "./rawg.js";

const PRICES_TTL = 12 * 60 * 60 * 1000;
const MISSING_TTL = 7 * 24 * 60 * 60 * 1000;
const RAWG_PARALLEL = 6;

export interface PriceRow {
  game_slug: string;
  itad_id: string | null;
  offers: StoreOffer[];
  lowest: LowestEver | null;
  checked_at: string;
}

export interface PriceStore {
  read(slugs: string[]): Promise<PriceRow[]>;
  write(rows: PriceRow[]): Promise<void>;
}

export type SteamHints = Record<string, string | null>;

async function eachLimited<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await task(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function quietly<T>(call: () => Promise<T>): Promise<T | undefined> {
  try {
    return await call();
  } catch (error) {
    if (!(error instanceof UpstreamError && error.status === 404)) console.error(error);
    return undefined;
  }
}

async function steamAppFor(slug: string) {
  const { results } = await rawgFetch<RawgList<RawgStoreLink>>(`games/${slug}/stores`);
  return results.map((link) => steamAppId(link.url ?? "")).find((id) => id !== null) ?? null;
}

// only pc games, so a console exclusive can't match a pc game with the same name
async function pcTitleFor(slug: string) {
  const game = await rawgFetch<RawgGameDetails>(`games/${slug}`);
  return game.parent_platforms?.some(({ platform }) => platform.slug === "pc") ? game.name : null;
}

async function findIds(slugs: string[], hints: SteamHints) {
  const ids = new Map<string, string | null>();
  const steam = new Map<string, string>();

  await eachLimited(slugs, RAWG_PARALLEL, async (slug) => {
    // hasOwn, `in` would also find "constructor" on every object
    const appId = Object.hasOwn(hints, slug) ? hints[slug] : await quietly(() => steamAppFor(slug));
    if (appId === undefined) return;
    ids.set(slug, null);
    if (appId) steam.set(slug, appId);
  });
  const bySteam = await idsBySteamApp([...new Set(steam.values())]);
  for (const [slug, appId] of steam) ids.set(slug, bySteam.get(appId) ?? null);

  const titles = new Map<string, string>();
  const unmatched = [...ids].filter(([, id]) => !id).map(([slug]) => slug);
  await eachLimited(unmatched, RAWG_PARALLEL, async (slug) => {
    const title = await quietly(() => pcTitleFor(slug));
    if (title === undefined) ids.delete(slug);
    else if (title) titles.set(slug, title);
  });
  const byTitle = await idsByTitle([...new Set(titles.values())]);
  for (const [slug, title] of titles) ids.set(slug, byTitle.get(title) ?? null);

  return ids;
}

export async function priceRows(slugs: string[], store: PriceStore, hints: SteamHints = {}) {
  const rows = new Map((await store.read(slugs)).map((row) => [row.game_slug, row]));
  const now = Date.now();
  const age = (row: PriceRow) => now - Date.parse(row.checked_at);
  const unmapped = slugs.filter((slug) => {
    const row = rows.get(slug);
    return !row || (!row.itad_id && age(row) > MISSING_TTL);
  });
  const stale = slugs.filter((slug) => {
    const row = rows.get(slug);
    return !!row?.itad_id && age(row) > PRICES_TTL;
  });
  if (!unmapped.length && !stale.length) return rows;

  let ids = new Map<string, string | null>();
  try {
    ids = await findIds(unmapped, hints);
  } catch (error) {
    console.error(error);
  }
  for (const slug of stale) ids.set(slug, rows.get(slug)!.itad_id);

  try {
    const deals = await dealsFor([...new Set([...ids.values()].filter((id) => id !== null))]);

    const checked_at = new Date().toISOString();
    const fresh = [...ids].map(([slug, id]): PriceRow => {
      const found = id ? deals.get(id) : undefined;
      return {
        game_slug: slug,
        itad_id: id,
        offers: found?.offers ?? [],
        lowest: found?.lowestEver ?? null,
        checked_at,
      };
    });
    for (const row of fresh) rows.set(row.game_slug, row);
    if (fresh.length) await store.write(fresh);
  } catch (error) {
    console.error(error);
  }
  return rows;
}

export function cheapest(row: PriceRow | undefined): Price | null {
  const offer = row?.offers[0];
  if (!offer || offer.price === null || offer.regularPrice === null) return null;
  return { amount: offer.price, regular: offer.regularPrice, store: offer.store };
}
