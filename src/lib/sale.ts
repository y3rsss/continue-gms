import type { Price } from "@shared/types";
import { discount } from "@/lib/format";
import type { BacklogEntry } from "../hooks/useBacklog";

export const cleanStores = (list: unknown[]) =>
  [...new Set(list.filter((id): id is number => Number.isInteger(id) && (id as number) > 0))].sort(
    (a, b) => a - b,
  );

export function parseStores(raw: string | null): number[] {
  try {
    const stored: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(stored) ? cleanStores(stored) : [];
  } catch {
    return [];
  }
}

export const inStores =
  (stores: number[]) =>
  ({ shopId }: { shopId?: number | null }) =>
    stores.length === 0 || (shopId != null && stores.includes(shopId));

export const bestPrice = (prices: Price[], stores: number[]) => prices.find(inStores(stores)) ?? null;

export const isOnSale = (price: Price | null | undefined) =>
  !!price && discount(price.amount, price.regular) > 0;

export const BACKLOG_SORTS = {
  recent: "Recent",
  discount: "Biggest discount",
  price: "Lowest price",
} as const;

export type BacklogSort = keyof typeof BACKLOG_SORTS;

export function sortEntries(
  entries: BacklogEntry[],
  prices: Record<string, Price | null | undefined>,
  sort: BacklogSort,
): BacklogEntry[] {
  if (sort === "recent") return entries;

  const rank = (entry: BacklogEntry) => {
    const price = prices[entry.game.slug];
    if (!price) return Infinity;
    return sort === "price" ? price.amount : -discount(price.amount, price.regular);
  };
  return [...entries].sort((a, b) => rank(a) - rank(b));
}
