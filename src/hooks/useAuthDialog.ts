import { useSyncExternalStore } from "react";

export type AuthView = "signin" | "signup" | "forgot" | "sent-signup" | "sent-reset";

interface State {
  view: AuthView | null;
  email: string;
}

let state: State = { view: null, email: "" };
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const openAuth = (view: AuthView = "signin") => set({ view });
export const closeAuth = () => set({ view: null });
export const setAuthEmail = (email: string) => set({ email });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useAuthDialog = () => useSyncExternalStore(subscribe, () => state);
