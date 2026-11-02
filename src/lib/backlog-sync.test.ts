import { describe, expect, it, vi } from "vitest";
import type { BacklogEntry } from "../hooks/useBacklog";
import { fromRows, newerThan } from "./backlog-sync";
import type { Json } from "./database.types";

vi.mock("./supabase", () => ({ supabase: {} }));

const game = {
  id: 3328,
  slug: "the-witcher-3-wild-hunt",
  name: "The Witcher 3: Wild Hunt",
  image: "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg",
  released: "2015-05-18",
  platforms: [{ slug: "pc", name: "PC" }],
  genres: [{ slug: "role-playing-games-rpg", name: "RPG" }],
  metascore: 92,
  rating: 4.65,
};

const row = (json: unknown, slug = game.slug) => ({
  game_slug: slug,
  status: "want" as const,
  game: json as Json,
  updated_at: "2026-10-30T12:00:00.000Z",
});

describe("fromRows", () => {
  it("turns a valid row into a backlog entry", () => {
    expect(fromRows([row(game)])).toEqual([
      [game.slug, { status: "want", game, updatedAt: Date.parse("2026-10-30T12:00:00.000Z") }],
    ]);
  });

  it("drops rows whose game doesn't match the slug or has the wrong shape", () => {
    expect(fromRows([row(game, "portal-2")])).toEqual([]);
    expect(fromRows([row("a string")])).toEqual([]);
    expect(fromRows([row([game])])).toEqual([]);
    expect(fromRows([row({ ...game, name: 5 })])).toEqual([]);
    expect(fromRows([row({ ...game, platforms: [{ slug: "pc" }] })])).toEqual([]);
    expect(fromRows([row({ ...game, metascore: "92" })])).toEqual([]);
  });

  it("keeps the good rows next to a broken one", () => {
    const broken = row({ ...game, slug: "portal-2", rating: null }, "portal-2");
    expect(fromRows([broken, row(game)]).map(([slug]) => slug)).toEqual([game.slug]);
  });

  it("only keeps images from RAWG", () => {
    for (const image of [
      "https://evil.example/tracker.gif",
      "https://media.rawg.io.evil.example/tracker.gif",
    ]) {
      const [[, entry]] = fromRows([row({ ...game, image })]);
      expect(entry.game.image).toBeNull();
    }
  });

  it("leaves out fields the app doesn't use", () => {
    const [[, entry]] = fromRows([
      row({ ...game, extra: "<script>", platforms: [{ slug: "pc", name: "PC", extra: 1 }] }),
    ]);
    expect(entry.game).toEqual(game);
  });
});

describe("newerThan", () => {
  const entry = (updatedAt: number): BacklogEntry => ({ status: "want", game, updatedAt });

  it("keeps local games the remote doesn't have or has an older copy of", () => {
    const local = { a: entry(5), b: entry(9) };
    expect(Object.keys(newerThan(local, { b: entry(3) }))).toEqual(["a", "b"]);
  });

  it("leaves out local games the remote has a newer or equal copy of", () => {
    const local = { a: entry(5), b: entry(5) };
    expect(newerThan(local, { a: entry(8), b: entry(5) })).toEqual({});
  });
});
