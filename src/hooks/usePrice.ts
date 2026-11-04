import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { MAX_PRICED_GAMES, SLUG } from "@shared/limits";
import type { Price, PricesAnswer } from "@shared/types";
import { bestPrice } from "@/lib/sale";
import { getJson } from "../services/api";
import { usePriceStores } from "./usePriceStores";

interface Waiter {
  resolve: (prices: Price[]) => void;
  reject: (error: unknown) => void;
}

let queue = new Map<string, Waiter[]>();
let timer: ReturnType<typeof setTimeout> | undefined;

function enqueue(slug: string, waiter: Waiter) {
  queue.set(slug, [...(queue.get(slug) ?? []), waiter]);
  timer ??= setTimeout(flush, 10);
}

function flush() {
  const batch = queue;
  queue = new Map();
  timer = undefined;
  const slugs = [...batch.keys()].sort();
  for (let i = 0; i < slugs.length; i += MAX_PRICED_GAMES) {
    const chunk = slugs.slice(i, i + MAX_PRICED_GAMES);
    const settle = (each: (waiter: Waiter, slug: string) => void) =>
      chunk.forEach((slug) => batch.get(slug)!.forEach((waiter) => each(waiter, slug)));
    getJson<PricesAnswer>("/api/prices", { slugs: chunk.join(",") })
      .then(({ prices }) => {
        const answered = (slug: string) => Object.hasOwn(prices, slug);
        if (!chunk.some(answered)) throw new Error("No prices came back");
        settle((waiter, slug) =>
          answered(slug) ? waiter.resolve(prices[slug] ?? []) : enqueue(slug, waiter),
        );
      })
      .catch((error) => settle((waiter) => waiter.reject(error)));
  }
}

const loadPrice = (slug: string) =>
  new Promise<Price[]>((resolve, reject) => {
    if (!SLUG.test(slug)) return resolve([]);
    enqueue(slug, { resolve, reject });
  });

const priceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["price", slug],
    queryFn: () => loadPrice(slug),
    staleTime: 60 * 60 * 1000,
    retryOnMount: false,
  });

export const usePrice = (slug: string) => {
  const stores = usePriceStores();
  return useQuery({ ...priceQuery(slug), select: (prices) => bestPrice(prices, stores) });
};

export const usePrices = (slugs: string[]) => {
  const stores = usePriceStores();
  return useQueries({
    queries: slugs.map((slug) => ({
      ...priceQuery(slug),
      select: (prices: Price[]) => bestPrice(prices, stores),
    })),
    combine: (results) => ({
      prices: Object.fromEntries(slugs.map((slug, i) => [slug, results[i].data])),
      pending: results.some((result) => result.isPending),
      failed: results.some((result) => result.isLoadingError),
    }),
  });
};
