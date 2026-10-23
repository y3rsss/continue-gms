import { LISTS, SORT_OPTIONS, type GamesPage, type List, type SortOption } from "../shared/types.js";
import { cacheFor, errorResponse } from "./_lib/http.js";
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

  try {
    const data = await rawgFetch<RawgList<RawgGame>>("games", {
      genres: genre,
      parent_platforms: platform && PLATFORM_IDS[platform],
      // RAWG's own relevance puts junk first for searches; popularity is far closer to what people mean
      ordering: SORT_ORDERING[sort] ?? (search ? "-added" : undefined),
      search,
      search_precise: search && "true",
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
