import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";

let session: Session | null | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

// supabase-js is a quarter of a megabyte, so it loads after the first paint instead of before it (kind of optimization)
import("@/lib/supabase")
  .then(({ supabase }) => {
    // fires once with the stored session, then on every sign in, sign out and token refresh
    supabase.auth.onAuthStateChange((_event, next) => {
      session = next;
      emit();
    });
  })
  .catch(() => {
    session = null;
    emit();
  });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// undefined while the stored session is still loading
export const useSession = () => useSyncExternalStore(subscribe, () => session);

export const useUser = () => useSession()?.user;
