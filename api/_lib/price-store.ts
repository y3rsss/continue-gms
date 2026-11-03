import { admin } from "./db.js";
import type { PriceRow, PriceStore } from "./prices.js";

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
