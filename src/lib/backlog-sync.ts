import type { Game } from "@shared/types";
import type { Backlog, BacklogEntry } from "../hooks/useBacklog";
import type { Json } from "./database.types";
import { supabase } from "./supabase";

const toRow = (userId: string, slug: string, entry: BacklogEntry) => ({
  user_id: userId,
  game_slug: slug,
  status: entry.status,
  game: entry.game as unknown as Json,
  updated_at: new Date(entry.updatedAt).toISOString(),
});

// the user_id filter matters, rls also lets you read everyone else's public backlog
export async function fetchBacklog(userId: string): Promise<Backlog> {
  const { data, error } = await supabase
    .from("backlog_entries")
    .select("game_slug, status, game, updated_at")
    .eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries(
    data.map((row) => [
      row.game_slug,
      { status: row.status, game: row.game as unknown as Game, updatedAt: Date.parse(row.updated_at) },
    ]),
  );
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
