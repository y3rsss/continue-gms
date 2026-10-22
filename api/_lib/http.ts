export class UpstreamError extends Error {
  constructor(
    public provider: string,
    public status: number,
  ) {
    super(`${provider} responded with ${status}`);
  }
}

export const SLUG = /^[a-z0-9-]{1,120}$/;

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
