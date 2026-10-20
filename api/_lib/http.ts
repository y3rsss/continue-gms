import { UpstreamError } from "./rawg.js";

export const cacheFor = (seconds: number) => ({
  "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 24}`,
});

export function errorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof UpstreamError) {
    return Response.json({ error: "Game data provider failed" }, { status: 502 });
  }
  return Response.json({ error: "Internal error" }, { status: 500 });
}
