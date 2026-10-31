import { useQuery } from "@tanstack/react-query";
import { MAX_PRICED_GAMES, SLUG } from "@shared/limits";
import type { Price, Prices } from "@shared/types";
import { getJson } from "../services/api";

interface Waiter {
  resolve: (price: Price | null) => void;
  reject: (error: unknown) => void;
}

let queue = new Map<string, Waiter[]>();
let timer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  const batch = queue;
  queue = new Map();
  timer = undefined;
  const slugs = [...batch.keys()].sort();
  for (let i = 0; i < slugs.length; i += MAX_PRICED_GAMES) {
    const chunk = slugs.slice(i, i + MAX_PRICED_GAMES);
    const settle = (each: (waiter: Waiter, slug: string) => void) =>
      chunk.forEach((slug) => batch.get(slug)!.forEach((waiter) => each(waiter, slug)));
    getJson<Prices>("/api/prices", { slugs: chunk.join(",") }).then(
      (prices) => settle((waiter, slug) => waiter.resolve(prices[slug] ?? null)),
      (error) => settle((waiter) => waiter.reject(error)),
    );
  }
}

const loadPrice = (slug: string) =>
  new Promise<Price | null>((resolve, reject) => {
    if (!SLUG.test(slug)) return resolve(null);
    queue.set(slug, [...(queue.get(slug) ?? []), { resolve, reject }]);
    timer ??= setTimeout(flush, 10);
  });

export const usePrice = (slug: string) =>
  useQuery({
    queryKey: ["price", slug],
    queryFn: () => loadPrice(slug),
    staleTime: 60 * 60 * 1000,
  });
