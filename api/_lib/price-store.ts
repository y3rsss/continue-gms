import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PriceRow, PriceStore } from "./prices.js";

let client: SupabaseClient | undefined;

function admin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export const priceStore = (): PriceStore => ({
  async read(slugs) {
    const { data, error } = await admin()
      .from("game_prices")
      .select("game_slug, itad_id, offers, lowest, checked_at")
      .in("game_slug", slugs);
    if (error) throw error;
    return data as PriceRow[];
  },
  async write(rows) {
    const { error } = await admin().from("game_prices").upsert(rows);
    if (error) throw error;
  },
});
