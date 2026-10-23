import type { Game } from "../shared/types.js";
import { cacheFor, errorResponse } from "./_lib/http.js";
import { rawgFetch, toGame, type RawgGame, type RawgList } from "./_lib/rawg.js";

const RESULTS = 8;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// RAWG's own order puts junk first ("witcher" ranks a 2-player fan game above The Witcher 3),
// so take a bigger pool and rank by how well the name matches plus how many people play it
function rank(games: RawgGame[], query: string): RawgGame[] {
  const q = normalize(query);
  const words = q.split(" ");

  const score = (game: RawgGame) => {
    const name = normalize(game.name);
    const match =
      name === q ? 2 : name.startsWith(q) ? 1.2 : words.every((word) => name.includes(word)) ? 0.6 : -1.5;
    return match + Math.log10((game.added ?? 0) + 1);
  };

  return [...games].sort((a, b) => score(b) - score(a));
}

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 60) {
    return Response.json({ error: "Search for 2 to 60 characters" }, { status: 400 });
  }

  try {
    const data = await rawgFetch<RawgList<RawgGame>>("games", { search: query, page_size: 40 });
    const results: Game[] = rank(data.results, query).slice(0, RESULTS).map(toGame);
    return Response.json({ results }, { headers: cacheFor(24 * 60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
