import { vi } from "vitest";

// replaces fetch for tests: return data to answer with JSON, a Response as is, or undefined for a 404
export function fakeFetch(answer: (url: URL) => unknown) {
  const fetch = vi.fn(async (input: string | URL) => {
    const result = answer(new URL(String(input)));
    if (result instanceof Response) return result;
    if (result === undefined) return new Response('{"detail":"Not found."}', { status: 404 });
    return new Response(JSON.stringify(result));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
