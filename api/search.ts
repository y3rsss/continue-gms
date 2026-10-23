import { cacheFor, errorResponse } from "./_lib/http.js";
import { searchGames } from "./_lib/search.js";

const RESULTS = 8;

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 60) {
    return Response.json({ error: "Search for 2 to 60 characters" }, { status: 400 });
  }

  try {
    const results = (await searchGames(query, "relevance")).slice(0, RESULTS);
    return Response.json({ results }, { headers: cacheFor(24 * 60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
