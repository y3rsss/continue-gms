import type { Game } from "@shared/types";
import type { Backlog, BacklogEntry } from "../hooks/useBacklog";
import type { Database, Json } from "./database.types";
import { supabase } from "./supabase";

type Row = Pick<
  Database["public"]["Tables"]["backlog_entries"]["Row"],
  "game_slug" | "status" | "game" | "updated_at"
>;

const toRow = (userId: string, slug: string, entry: BacklogEntry) => ({
  user_id: userId,
  game_slug: slug,
  status: entry.status,
  game: entry.game as unknown as Json,
  updated_at: new Date(entry.updatedAt).toISOString(),
});

type Named = { slug: string; name: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNamedList = (value: unknown): value is Named[] =>
  Array.isArray(value) &&
  value.every((item) => isObject(item) && typeof item.slug === "string" && typeof item.name === "string");

const isNumberOrNull = (value: unknown) => value === null || typeof value === "number";

// rows are written by their owners through the api, so another user's game json can be anything
function parseGame(value: Json, slug: string): Game | null {
  if (!isObject(value)) return null;
  const { id, name, image, released, platforms, genres, metascore, rating } = value;
  if (
    value.slug !== slug ||
    typeof id !== "number" ||
    typeof name !== "string" ||
    !(released === null || typeof released === "string") ||
    !isNamedList(platforms) ||
    !isNamedList(genres) ||
    !isNumberOrNull(metascore) ||
    typeof rating !== "number"
  ) {
    return null;
  }
  return {
    id,
    slug,
    name,
    image: typeof image === "string" && image.startsWith("https://media.rawg.io/") ? image : null,
    released,
    platforms: platforms.map(({ slug, name }) => ({ slug, name })),
    genres: genres.map(({ slug, name }) => ({ slug, name })),
    metascore: metascore as number | null,
    rating,
  };
}

export const fromRows = (rows: Row[]): [string, BacklogEntry][] =>
  rows.flatMap((row) => {
    const game = parseGame(row.game, row.game_slug);
    return game ? [[row.game_slug, { status: row.status, game, updatedAt: Date.parse(row.updated_at) }]] : [];
  });

// the user_id filter matters, rls also lets you read everyone else's public backlog
export async function fetchBacklog(userId: string): Promise<Backlog> {
  const { data, error } = await supabase
    .from("backlog_entries")
    .select("game_slug, status, game, updated_at")
    .eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries(fromRows(data));
}

export async function saveEntries(userId: string, entries: Backlog) {
  const rows = Object.entries(entries).map(([slug, entry]) => toRow(userId, slug, entry));
  if (!rows.length) return;
  const { error } = await supabase.from("backlog_entries").upsert(rows);
  if (error) throw error;
}

export async function removeEntry(userId: string, slug: string) {
  const { error } = await supabase
    .from("backlog_entries")
    .delete()
    .match({ user_id: userId, game_slug: slug });
  if (error) throw error;
}

export const newerThan = (local: Backlog, remote: Backlog): Backlog =>
  Object.fromEntries(
    Object.entries(local).filter(
      ([slug, entry]) => !remote[slug] || entry.updatedAt > remote[slug].updatedAt,
    ),
  );
