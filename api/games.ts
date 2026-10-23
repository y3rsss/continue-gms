import { LISTS, SORT_OPTIONS, type GamesPage, type List, type SortOption } from "../shared/types.js";
import { cacheFor, errorResponse } from "./_lib/http.js";
import { searchGames } from "./_lib/search.js";
import {
  LIST_PARAMS,
  PLATFORM_IDS,
  SORT_ORDERING,
  rawgFetch,
  toGame,
  type RawgGame,
  type RawgList,
} from "./_lib/rawg.js";

const SLUG = /^[a-z0-9-]{1,60}$/;

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;

  const genre = params.get("genre") ?? undefined;
  const platform = params.get("platform") ?? undefined;
  const sort = (params.get("sort") ?? "relevance") as SortOption;
  const search = params.get("search")?.trim().slice(0, 100) || undefined;
  const list = params.get("list") ?? undefined;
  const page = Number(params.get("page") ?? 1);
  const size = Number(params.get("size") ?? 24);

  if (
    (genre && !SLUG.test(genre)) ||
    (platform && !(platform in PLATFORM_IDS)) ||
    !(sort in SORT_OPTIONS) ||
    (list && !LISTS.includes(list as List)) ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 40 ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 500
  ) {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }

  const filters = { genres: genre, parent_platforms: platform ? PLATFORM_IDS[platform] : undefined };

  try {
    if (search) {
      const matches = await searchGames(search, sort, filters);
      const start = (page - 1) * size;
      const body: GamesPage = {
        results: matches.slice(start, start + size),
        count: matches.length,
        nextPage: start + size < matches.length ? page + 1 : null,
      };
      return Response.json(body, { headers: cacheFor(60 * 60) });
    }

    const data = await rawgFetch<RawgList<RawgGame>>("games", {
      ...filters,
      ordering: SORT_ORDERING[sort],
      page,
      page_size: size,
      ...(list && LIST_PARAMS[list as List]()),
    });

    const body: GamesPage = {
      results: data.results.map(toGame),
      count: data.count,
      nextPage: data.next ? page + 1 : null,
    };
    return Response.json(body, { headers: cacheFor(60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
