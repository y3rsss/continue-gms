import type { StoreLink } from "../shared/types.js";
import { SLUG, cacheFor, errorResponse } from "./_lib/http.js";
import { rawgFetch, toStoreLink, type RawgList, type RawgStoreLink } from "./_lib/rawg.js";

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) {
    return Response.json({ error: "Invalid game" }, { status: 400 });
  }

  try {
    const data = await rawgFetch<RawgList<RawgStoreLink>>(`games/${slug}/stores`);
    const stores: StoreLink[] = data.results.filter((link) => link.url).map(toStoreLink);
    return Response.json(stores, { headers: cacheFor(24 * 60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
