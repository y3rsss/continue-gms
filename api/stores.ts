import { SLUG, cacheFor, errorResponse } from "./_lib/http.js";
import { whereToBuy } from "./_lib/offers.js";

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) {
    return Response.json({ error: "Invalid game" }, { status: 400 });
  }

  try {
    return Response.json(await whereToBuy(slug), { headers: cacheFor(60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
