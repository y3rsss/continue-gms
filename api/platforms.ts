import type { Platform } from "../shared/types.js";
import { answerWithCopy } from "./_lib/copies.js";
import { PLATFORM_IDS, rawgFetch, toPlatform, type RawgList, type RawgPlatform } from "./_lib/rawg.js";

export async function GET(): Promise<Response> {
  return answerWithCopy("platforms", 24 * 60 * 60, async (): Promise<Platform[]> => {
    const data = await rawgFetch<RawgList<RawgPlatform>>("platforms/lists/parents");
    return data.results.filter((p) => p.slug in PLATFORM_IDS).map(toPlatform);
  });
}
