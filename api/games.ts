import { SORT_OPTIONS, type GamesPage, type SortOption } from "../shared/types.js";
import { cacheFor, errorResponse } from "./_lib/http.js";
import {
  PLATFORM_IDS,
  SORT_ORDERING,
  rawgFetch,
  toGame,
  type RawgGame,
  type RawgList,
} from "./_lib/rawg.js";

const PAGE_SIZE = 24;
const SLUG = /^[a-z0-9-]{1,60}$/;

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;

  const genre = params.get("genre") ?? undefined;
  const platform = params.get("platform") ?? undefined;
  const sort = (params.get("sort") ?? "relevance") as SortOption;
  const search = params.get("search")?.trim().slice(0, 100) || undefined;
  const page = Number(params.get("page") ?? 1);

  if (
    (genre && !SLUG.test(genre)) ||
    (platform && !(platform in PLATFORM_IDS)) ||
    !(sort in SORT_OPTIONS) ||
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
      ordering: SORT_ORDERING[sort],
      search,
      search_precise: search && "true",
      page,
      page_size: PAGE_SIZE,
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
