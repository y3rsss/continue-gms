import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RawgGame } from "./rawg.js";
import { searchGames } from "./search.js";

const game = (id: number, name: string, added: number, extra: Partial<RawgGame> = {}): RawgGame => ({
  id,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  background_image: null,
  released: "2015-05-18",
  metacritic: null,
  rating: 0,
  added,
  ...extra,
});

const witcher3 = game(1, "The Witcher 3: Wild Hunt", 22391, { metacritic: 92 });
const witcher2 = game(2, "The Witcher 2: Assassins of Kings", 12061, { metacritic: 88 });
const witherJunk = game(3, "WITHER", 0);
const withering = game(4, "The Withering", 27);
const dearEsther = game(5, "Dear Esther", 9000, { metacritic: 75 });
const viceCity = game(6, "Grand Theft Auto: Vice City", 9977, { metacritic: 95 });
const gtaJunk = game(7, "GTA+", 0);

let lastUrls: URL[] = [];

function fakeRawg(fuzzy: RawgGame[], precise: RawgGame[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL) => {
      lastUrls.push(input);
      const results = input.searchParams.get("search_precise") ? precise : fuzzy;
      return new Response(JSON.stringify({ count: results.length, next: null, results }));
    }),
  );
}

beforeEach(() => {
  process.env.RAWG_API_KEY = "test-key";
  lastUrls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchGames", () => {
  it("puts a popular typo match above an unknown exact match", async () => {
    fakeRawg([witcher3, witcher2, witherJunk, dearEsther], [witherJunk, withering]);
    const names = (await searchGames("wither", "relevance")).map((g) => g.name);
    expect(names[0]).toBe("The Witcher 3: Wild Hunt");
    expect(names).toContain("WITHER");
    expect(names).toContain("The Withering");
  });

  it("drops games whose names don't match at all", async () => {
    fakeRawg([witcher3, dearEsther], []);
    const names = (await searchGames("wither", "relevance")).map((g) => g.name);
    expect(names).not.toContain("Dear Esther");
  });

  it("matches initials, so gta finds Grand Theft Auto", async () => {
    fakeRawg([gtaJunk, viceCity], [gtaJunk]);
    const names = (await searchGames("gta", "relevance")).map((g) => g.name);
    expect(names[0]).toBe("Grand Theft Auto: Vice City");
  });

  it("lists a game found by both searches once", async () => {
    fakeRawg([witcher3, witherJunk], [witherJunk]);
    const results = await searchGames("wither", "relevance");
    expect(results.filter((g) => g.name === "WITHER")).toHaveLength(1);
  });

  it("sorts the same matches by the chosen field", async () => {
    fakeRawg([witcher3, witcher2, witherJunk, withering], []);
    const byScore = (await searchGames("wither", "metascore")).map((g) => g.metascore);
    expect(byScore).toEqual([92, 88, null, null]);
    const byName = (await searchGames("wither", "name")).map((g) => g.name);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));
  });

  it("passes filters on to RAWG", async () => {
    fakeRawg([], []);
    await searchGames("wither", "relevance", { genres: "action", parent_platforms: 1 });
    for (const url of lastUrls) {
      expect(url.searchParams.get("genres")).toBe("action");
      expect(url.searchParams.get("parent_platforms")).toBe("1");
    }
    expect(lastUrls).toHaveLength(2);
  });
});
