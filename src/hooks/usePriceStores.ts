import { useSyncExternalStore } from "react";
import { cleanStores, parseStores } from "@/lib/sale";

const KEY = "continue.stores";
const listeners = new Set<() => void>();

function read() {
  try {
    return parseStores(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

let stores = read();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    stores = read();
    notify();
  });
}

export function setPriceStores(next: number[]) {
  stores = cleanStores(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(stores));
  } catch {
    // not persisted, still applies for this session
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const usePriceStores = () => useSyncExternalStore(subscribe, () => stores);
