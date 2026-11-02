import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { MAX_PRICED_GAMES, SLUG } from "@shared/limits";
import type { Price, Prices } from "@shared/types";
import { getJson } from "../services/api";

interface Waiter {
  resolve: (price: Price | null) => void;
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
    getJson<Prices>("/api/prices", { slugs: chunk.join(",") })
      .then((prices) => {
        const answered = (slug: string) => Object.hasOwn(prices, slug);
        if (!chunk.some(answered)) throw new Error("No prices came back");
        settle((waiter, slug) =>
          answered(slug) ? waiter.resolve(prices[slug] ?? null) : enqueue(slug, waiter),
        );
      })
      .catch((error) => settle((waiter) => waiter.reject(error)));
  }
}

const loadPrice = (slug: string) =>
  new Promise<Price | null>((resolve, reject) => {
    if (!SLUG.test(slug)) return resolve(null);
    enqueue(slug, { resolve, reject });
  });

const priceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["price", slug],
    queryFn: () => loadPrice(slug),
    staleTime: 60 * 60 * 1000,
    retryOnMount: false,
  });

export const usePrice = (slug: string) => useQuery(priceQuery(slug));

export const usePrices = (slugs: string[]) =>
  useQueries({
    queries: slugs.map((slug) => priceQuery(slug)),
    combine: (results) => ({
      prices: Object.fromEntries(slugs.map((slug, i) => [slug, results[i].data])),
      pending: results.some((result) => result.isPending),
      failed: results.some((result) => result.isLoadingError),
    }),
  });
