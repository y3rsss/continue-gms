import { useSyncExternalStore } from "react";
import type { Game } from "@shared/types";
import { toast } from "@/lib/toast";

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

export type Backlog = Record<string, BacklogEntry>;

// guest shelf while signed out, a copy of the account shelf while signed in
const GUEST = "continue.backlog";
const ACCOUNT = "continue.backlog.account";

interface AccountCopy {
  owner: string;
  entries: Backlog;
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function load<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked, keep the in-memory copy
  }
}

const sync = () => import("@/lib/backlog-sync");

// whose shelf is showing, null for the guest one. known before supabase loads so a reload doesn't flash empty
let owner = typeof window === "undefined" ? null : (load<AccountCopy>(ACCOUNT)?.owner ?? null);
let signedIn: string | null | undefined;
let ready = true;
let cache: Backlog | null = null;
// changes still on their way to supabase, a pull must not undo them
const pending = new Map<string, BacklogEntry | null>();
let queue = Promise.resolve();

const enqueue = (task: () => Promise<void>) => {
  queue = queue.then(task).catch(() => {});
};

function read(): Backlog {
  if (cache) return cache;
  if (!owner) return (cache = load<Backlog>(GUEST) ?? {});
  const copy = load<AccountCopy>(ACCOUNT);
  return (cache = copy?.owner === owner ? copy.entries : {});
}

function write(next: Backlog) {
  cache = next;
  save(owner ? ACCOUNT : GUEST, owner ? { owner, entries: next } : next);
  emit();
}

async function pull(userId: string, quiet: boolean) {
  try {
    const { fetchBacklog, saveEntries, newerThan } = await sync();
    const remote = await fetchBacklog(userId);
    const upload = newerThan(load<Backlog>(GUEST) ?? {}, remote);
    const count = Object.keys(upload).length;
    if (count) {
      await saveEntries(userId, upload);
      toast(`Saved ${count} ${count === 1 ? "game" : "games"} to your account.`);
    }
    save(GUEST, null);
    if (owner !== userId) return;
    const next = { ...remote, ...upload };
    pending.forEach((entry, slug) => {
      if (entry) next[slug] = entry;
      else delete next[slug];
    });
    write(next);
  } catch {
    if (!quiet) toast("Couldn't load your backlog. Check your connection.", "alert");
  } finally {
    if (owner === userId && !ready) {
      ready = true;
      emit();
    }
  }
}

function switchTo(userId: string | null) {
  // token refreshes fire the auth event too
  if (userId === signedIn) return;
  signedIn = userId;

  if (userId && owner !== userId) {
    // keep showing the guest games while they upload, a previous account's copy goes
    const guest = owner ? {} : read();
    owner = userId;
    ready = false;
    write(guest);
  }
  if (!userId && owner) {
    save(ACCOUNT, null);
    owner = null;
    cache = null;
    ready = true;
    emit();
  }
  if (userId) enqueue(() => pull(userId, false));
}

if (typeof window !== "undefined") {
  import("@/lib/supabase")
    .then(({ supabase }) =>
      supabase.auth.onAuthStateChange((_event, session) => {
        // calling supabase inside this callback deadlocks it, so step out first
        setTimeout(() => switchTo(session?.user.id ?? null));
      }),
    )
    .catch(() => {});

  // picks up changes made on other devices
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && signedIn) {
      const userId = signedIn;
      enqueue(() => pull(userId, true));
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== GUEST && event.key !== ACCOUNT) return;
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
  let entry: BacklogEntry | null = null;
  if (status) {
    const { id, slug, name, image, released, platforms, genres, metascore, rating } = game;
    entry = {
      status,
      game: { id, slug, name, image, released, platforms, genres, metascore, rating },
      updatedAt: Date.now(),
    };
    next[slug] = entry;
  } else {
    delete next[game.slug];
  }
  write(next);

  if (!owner) return;
  const userId = owner;
  const slug = game.slug;
  pending.set(slug, entry);
  enqueue(async () => {
    let failed = false;
    try {
      const { saveEntries, removeEntry } = await sync();
      if (entry) await saveEntries(userId, { [slug]: entry });
      else await removeEntry(userId, slug);
    } catch {
      failed = true;
    }
    if (pending.get(slug) === entry) pending.delete(slug);
    if (failed) {
      toast("Couldn't save that change. Check your connection.", "alert");
      // put back whatever supabase actually has
      await pull(userId, true);
    }
  });
}

export const useBacklog = () => useSyncExternalStore(subscribe, read);

// false while a freshly signed in account's backlog is still loading
export const useBacklogReady = () => useSyncExternalStore(subscribe, () => ready);

export const useStatus = (slug: string) => useBacklog()[slug]?.status;
