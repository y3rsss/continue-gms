import type { Genre } from "../shared/types.js";
import { answerWithCopy } from "./_lib/copies.js";
import { rawgFetch, toGenre, type RawgGenre, type RawgList } from "./_lib/rawg.js";

export async function GET(): Promise<Response> {
  return answerWithCopy("genres", 24 * 60 * 60, async (): Promise<Genre[]> => {
    const data = await rawgFetch<RawgList<RawgGenre>>("genres", { page_size: 40 });
    return data.results.map(toGenre);
  });
}
