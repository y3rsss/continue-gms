import { MAX_PRICED_GAMES } from "../shared/limits.js";
import type { Prices } from "../shared/types.js";
import { SLUG, cacheFor, errorResponse } from "./_lib/http.js";
import { priceStore } from "./_lib/price-store.js";
import { cheapest, priceRows } from "./_lib/prices.js";

export async function GET(request: Request): Promise<Response> {
  const slugs = [...new Set(new URL(request.url).searchParams.get("slugs")?.split(",") ?? [])];
  if (!slugs.length || slugs.length > MAX_PRICED_GAMES || !slugs.every((slug) => SLUG.test(slug))) {
    return Response.json({ error: "Invalid games" }, { status: 400 });
  }

  try {
    const rows = await priceRows(slugs, priceStore());
    const prices: Prices = Object.fromEntries(slugs.map((slug) => [slug, cheapest(rows.get(slug))]));
    // games that couldn't be looked up this time get another try soon
    const complete = slugs.every((slug) => rows.has(slug));
    return Response.json(prices, { headers: cacheFor(complete ? 60 * 60 : 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
