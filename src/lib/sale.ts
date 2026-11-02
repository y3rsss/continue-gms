import type { Price } from "@shared/types";
import { discount } from "@/lib/format";
import type { BacklogEntry } from "../hooks/useBacklog";

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
