import type { Platform } from "../shared/types.js";
import { cacheFor, errorResponse } from "./_lib/http.js";
import {
  PLATFORM_IDS,
  rawgFetch,
  toPlatform,
  type RawgList,
  type RawgPlatform,
} from "./_lib/rawg.js";

export async function GET(): Promise<Response> {
  try {
    const data = await rawgFetch<RawgList<RawgPlatform>>("platforms/lists/parents");
    const body: Platform[] = data.results
      .filter((p) => p.slug in PLATFORM_IDS)
      .map(toPlatform);
    return Response.json(body, { headers: cacheFor(24 * 60 * 60) });
  } catch (error) {
    return errorResponse(error);
  }
}
