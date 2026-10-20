import type { Genre } from "../shared/types.js";
import { cacheFor, errorResponse } from "./_lib/http.js";
import { rawgFetch, toGenre, type RawgGenre, type RawgList } from "./_lib/rawg.js";

export async function GET(): Promise<Response> {
  try {
    const data = await rawgFetch<RawgList<RawgGenre>>("genres", { page_size: 40 });
    const body: Genre[] = data.results.map(toGenre);
    return Response.json(body, { headers: cacheFor(24 * 60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
