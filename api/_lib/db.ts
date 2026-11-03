import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DB_TIMEOUT = 5000;

let client: SupabaseClient | undefined;

const timedFetch: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(DB_TIMEOUT);
  return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
};

export function admin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
  return client;
}
