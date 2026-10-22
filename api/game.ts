import { SLUG, cacheFor, errorResponse } from "./_lib/http.js";
import {
  rawgFetch,
  toGameDetails,
  type RawgGame,
  type RawgGameDetails,
  type RawgList,
  type RawgScreenshot,
} from "./_lib/rawg.js";

const BROAD_GENRES = new Set(["action", "adventure", "indie", "casual"]);

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) {
    return Response.json({ error: "Invalid game" }, { status: 400 });
  }

  try {
    const [game, screenshots] = await Promise.all([
      rawgFetch<RawgGameDetails>(`games/${slug}`),
      rawgFetch<RawgList<RawgScreenshot>>(`games/${slug}/screenshots`, { page_size: 6 }),
    ]);

    const genres = game.genres ?? [];
    const specific = genres.filter((g) => !BROAD_GENRES.has(g.slug));
    const similar = genres.length
      ? await rawgFetch<RawgList<RawgGame>>("games", {
          genres: (specific.length ? specific : genres).map((g) => g.slug).join(","),
          ordering: "-metacritic",
          page_size: 5,
        })
      : { results: [] };

    return Response.json(toGameDetails(game, screenshots.results, similar.results), {
      headers: cacheFor(24 * 60 * 60),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
