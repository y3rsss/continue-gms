import { useSyncExternalStore } from "react";
import type { Game } from "@shared/types";

export const STATUSES = {
  want: "Want to play",
  playing: "Playing",
  finished: "Finished",
  dropped: "Dropped",
} as const;

export type Status = keyof typeof STATUSES;

export interface BacklogEntry {
  status: Status;
  game: Game;
  updatedAt: number;
}

type Backlog = Record<string, BacklogEntry>;

const KEY = "continue.backlog";
const listeners = new Set<() => void>();
let cache: Backlog | null = null;

function read(): Backlog {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Backlog;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Backlog) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked, keep the in-memory copy
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setStatus(game: Game, status: Status | null) {
  const next = { ...read() };
  if (status) {
    const { id, slug, name, image, released, platforms, genres, metascore, rating } = game;
    next[slug] = {
      status,
      game: { id, slug, name, image, released, platforms, genres, metascore, rating },
      updatedAt: Date.now(),
    };
  } else {
    delete next[game.slug];
  }
  write(next);
}

export const useBacklog = () => useSyncExternalStore(subscribe, read);

export const useStatus = (slug: string) => useBacklog()[slug]?.status;
