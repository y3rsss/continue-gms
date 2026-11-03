import type { CopyStore } from "./copies.js";
import { admin } from "./db.js";

export const copyStore = (): CopyStore => ({
  async read(key) {
    const { data, error } = await admin().from("api_copies").select("body").eq("key", key).maybeSingle();
    if (error) throw error;
    return data?.body ?? null;
  },
  async save(key, body) {
    const { error } = await admin().rpc("save_api_copy", { copy_key: key, copy_body: body });
    if (error) throw error;
  },
});
