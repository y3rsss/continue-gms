import { vi } from "vitest";

export function fakeFetch(answer: (url: URL, init?: RequestInit) => unknown) {
  const fetch = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const result = answer(new URL(String(input)), init);
    if (result instanceof Response) return result;
    if (result === undefined) return new Response('{"detail":"Not found."}', { status: 404 });
    return new Response(JSON.stringify(result));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
