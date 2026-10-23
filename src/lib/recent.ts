import type { Game } from "@shared/types";

export type RecentGame = Pick<Game, "slug" | "name" | "image" | "released" | "platforms" | "metascore">;

const KEY = "continue.recent";
const LIMIT = 5;

export function readRecent(): RecentGame[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentGame[];
  } catch {
    return [];
  }
}

export function rememberGame({ slug, name, image, released, platforms, metascore }: RecentGame) {
  const next = [
    { slug, name, image, released, platforms, metascore },
    ...readRecent().filter((game) => game.slug !== slug),
  ].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // not persisted
  }
}
