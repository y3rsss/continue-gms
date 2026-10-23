import type { Game, SortOption } from "../../shared/types.js";
import { rawgFetch, toGame, type RawgGame, type RawgList } from "./rawg.js";

export interface SearchFilters {
  genres?: string;
  parent_platforms?: number;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

const allowedTypos = (word: string) => (word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0);

function matchScore(name: string, query: string): number | null {
  const n = normalize(name);
  const q = normalize(query);
  const nameWords = n.split(" ");
  const queryWords = q.split(" ");
  const initials = nameWords.map((word) => word[0]).join("");

  if (n === q) return 3;
  if (n.startsWith(q)) return 2;
  if (queryWords.every((word) => n.includes(word))) return 1.2;
  if (q.length >= 3 && !q.includes(" ") && initials.includes(q)) return 1.2;
  if (
    queryWords.every((word) =>
      nameWords.some((nameWord) => editDistance(word, nameWord) <= allowedTypos(word)),
    )
  ) {
    return -0.3;
  }
  return null;
}

const popularity = (game: RawgGame) => Math.log10((game.added ?? 0) + 1);

const SORTS: Record<Exclude<SortOption, "relevance">, (a: RawgGame, b: RawgGame) => number> = {
  newest: (a, b) => (b.released ?? "").localeCompare(a.released ?? ""),
  added: (a, b) => (b.added ?? 0) - (a.added ?? 0),
  rating: (a, b) => b.rating - a.rating,
  metascore: (a, b) => (b.metacritic ?? -1) - (a.metacritic ?? -1),
  name: (a, b) => a.name.localeCompare(b.name),
};

// fuzzy search catches typos ("wither" -> The Witcher) but ranks junk first; precise search misses typos
export async function searchGames(
  query: string,
  sort: SortOption,
  filters: SearchFilters = {},
): Promise<Game[]> {
  const [fuzzy, exact] = await Promise.all([
    rawgFetch<RawgList<RawgGame>>("games", { search: query, page_size: 40, ...filters }),
    rawgFetch<RawgList<RawgGame>>("games", {
      search: query,
      search_precise: "true",
      page_size: 40,
      ...filters,
    }),
  ]);

  const unique = new Map([...fuzzy.results, ...exact.results].map((game) => [game.id, game]));
  const matches = [...unique.values()]
    .map((game) => ({ game, match: matchScore(game.name, query) }))
    .filter((entry): entry is { game: RawgGame; match: number } => entry.match !== null);

  const sorted =
    sort === "relevance"
      ? matches.sort((a, b) => b.match + popularity(b.game) - (a.match + popularity(a.game)))
      : matches.sort((a, b) => SORTS[sort](a.game, b.game));

  return sorted.map(({ game }) => toGame(game));
}
