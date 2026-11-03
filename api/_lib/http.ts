const UPSTREAM_TIMEOUT = 8000;

export class UpstreamError extends Error {
  constructor(
    public provider: string,
    public status: number,
    options?: ErrorOptions,
  ) {
    super(`${provider} failed with ${status}`, options);
  }
}

export async function upstreamJson<T>(provider: string, url: URL, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`${provider} didn't answer in time`)),
    UPSTREAM_TIMEOUT,
  );
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new UpstreamError(provider, response.status);
    return (await response.json()) as T;
  } catch (error) {
    throw error instanceof UpstreamError ? error : new UpstreamError(provider, 504, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

export { SLUG } from "../../shared/limits.js";

export const cacheFor = (seconds: number) => ({
  "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 24}`,
});

export function errorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof UpstreamError && error.status === 404) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }
  if (error instanceof UpstreamError) {
    return Response.json({ error: "Game data provider failed" }, { status: 502 });
  }
  return Response.json({ error: "Internal error" }, { status: 500 });
}
