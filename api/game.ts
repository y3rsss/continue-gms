import { answerWithCopy } from "./_lib/copies.js";
import { SLUG } from "./_lib/http.js";
import {
  rawgFetch,
  toGameDetails,
  type RawgGame,
  type RawgGameDetails,
  type RawgList,
  type RawgMovie,
  type RawgScreenshot,
} from "./_lib/rawg.js";

const BROAD_GENRES = new Set(["action", "adventure", "indie", "casual"]);

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) {
    return Response.json({ error: "Invalid game" }, { status: 400 });
  }

  return answerWithCopy(`game?slug=${slug}`, 24 * 60 * 60, async () => {
    const [game, screenshots, movies] = await Promise.all([
      rawgFetch<RawgGameDetails>(`games/${slug}`),
      rawgFetch<RawgList<RawgScreenshot>>(`games/${slug}/screenshots`, { page_size: 40 }),
      rawgFetch<RawgList<RawgMovie>>(`games/${slug}/movies`).catch(() => ({ results: [] })),
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

    return toGameDetails(game, screenshots.results, movies.results, similar.results);
  });
}
