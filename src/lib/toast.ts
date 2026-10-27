import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  message: string;
  tone: "ok" | "alert";
}

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function toast(message: string, tone: Toast["tone"] = "ok") {
  current = { id: nextId++, message, tone };
  emit();
}

export function dismissToast(id: number) {
  if (current?.id !== id) return;
  current = null;
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useToast = () => useSyncExternalStore(subscribe, () => current);
