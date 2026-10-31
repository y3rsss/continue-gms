import type {
  Game,
  GameDetails,
  Genre,
  List,
  Media,
  Platform,
  SortOption,
  StoreOffer,
} from "../../shared/types.js";
import { UpstreamError } from "./http.js";

const BASE_URL = "https://api.rawg.io/api/";

export async function rawgFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY is not set");

  const url = new URL(path, BASE_URL);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  }
  url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) throw new UpstreamError("RAWG", response.status);
  return response.json() as Promise<T>;
}

export const PLATFORM_IDS: Record<string, number> = {
  pc: 1,
  playstation: 2,
  xbox: 3,
  ios: 4,
  android: 8,
  mac: 5,
  linux: 6,
  nintendo: 7,
  web: 14,
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const lastDays = (days: number) => {
  const now = new Date();
  return `${isoDate(new Date(now.getTime() - days * 86_400_000))},${isoDate(now)}`;
};

export const LIST_PARAMS: Record<List, () => Record<string, string>> = {
  trending: () => ({ dates: lastDays(365), ordering: "-added" }),
  new: () => ({ dates: lastDays(60), ordering: "-added" }),
  greats: () => ({ metacritic: "90,100", ordering: "-metacritic" }),
};

export const SORT_ORDERING: Record<SortOption, string | undefined> = {
  relevance: undefined,
  newest: "-released",
  added: "-added",
  rating: "-rating",
  metascore: "-metacritic",
  name: "name",
};

// RAWG's CDN only serves these sizes, anything else 404s
const IMAGE_SIZES = {
  thumb: "resize/200/-",
  card: "crop/600/400",
  shot: "resize/640/-",
  hero: "resize/1280/-",
  full: "resize/1920/-",
} as const;

export function rawgImage(url: string | null | undefined, size: keyof typeof IMAGE_SIZES) {
  if (!url) return null;
  const marker = "media/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const at = index + marker.length;
  return `${url.slice(0, at)}${IMAGE_SIZES[size]}/${url.slice(at)}`;
}

export interface RawgPlatform {
  id: number;
  slug: string;
  name: string;
}

export interface RawgGenre {
  id: number;
  slug: string;
  name: string;
  image_background: string | null;
}

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  released: string | null;
  parent_platforms?: { platform: RawgPlatform }[] | null;
  genres?: RawgGenre[] | null;
  metacritic: number | null;
  rating: number;
  added?: number;
}

export interface RawgGameDetails extends RawgGame {
  background_image_additional: string | null;
  description_raw: string | null;
  developers?: { name: string }[] | null;
  publishers?: { name: string }[] | null;
  website: string | null;
}

export interface RawgMovie {
  id: number;
  name: string;
  preview: string | null;
  data: { "480": string; max: string };
}

export interface RawgScreenshot {
  id: number;
  image: string;
}

export interface RawgStoreLink {
  store_id: number;
  url: string;
}

export interface RawgList<T> {
  count: number;
  next: string | null;
  results: T[];
}

const STORE_NAMES: Record<number, string> = {
  1: "Steam",
  2: "Xbox Store",
  3: "PlayStation Store",
  4: "App Store",
  5: "GOG",
  6: "Nintendo eShop",
  7: "Xbox 360 Store",
  8: "Google Play",
  9: "itch.io",
  11: "Epic Games Store",
};

export function steamAppId(url: string): string | null {
  const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
  return match ? match[1] : null;
}

export const toStoreOffer = (link: RawgStoreLink): StoreOffer => ({
  store: STORE_NAMES[link.store_id] ?? "Other store",
  url: link.url.replace(/^http:/, "https:"),
  price: null,
  regularPrice: null,
});

export const toPlatform = (p: RawgPlatform): Platform => ({ slug: p.slug, name: p.name });

export const toGenre = (g: RawgGenre): Genre => ({
  slug: g.slug,
  name: g.name,
  image: rawgImage(g.image_background, "thumb"),
});

export const toGame = (g: RawgGame): Game => ({
  id: g.id,
  slug: g.slug,
  name: g.name,
  image: rawgImage(g.background_image, "card"),
  released: g.released,
  platforms: (g.parent_platforms ?? []).map((p) => toPlatform(p.platform)),
  genres: (g.genres ?? []).map((genre) => ({ slug: genre.slug, name: genre.name })),
  metascore: g.metacritic,
  rating: g.rating,
});

function toMedia(g: RawgGameDetails, screenshots: RawgScreenshot[], movies: RawgMovie[]): Media[] {
  const videos: Media[] = movies.map((movie) => ({
    kind: "video",
    src: movie.data.max,
    poster: movie.preview,
    title: movie.name,
  }));
  const originals = [g.background_image, g.background_image_additional, ...screenshots.map((s) => s.image)];
  const images: Media[] = [...new Set(originals.filter((url): url is string => !!url))].map((url) => ({
    kind: "image",
    full: rawgImage(url, "full")!,
    preview: rawgImage(url, "shot")!,
    thumb: rawgImage(url, "thumb")!,
  }));
  return [...videos.slice(0, 1), ...images, ...videos.slice(1)];
}

export const toGameDetails = (
  g: RawgGameDetails,
  screenshots: RawgScreenshot[],
  movies: RawgMovie[],
  similar: RawgGame[],
): GameDetails => ({
  ...toGame(g),
  hero: rawgImage(g.background_image, "hero"),
  description: g.description_raw?.trim() ?? "",
  developers: (g.developers ?? []).map((d) => d.name),
  publishers: (g.publishers ?? []).map((p) => p.name),
  website: g.website || null,
  media: toMedia(g, screenshots, movies),
  similar: similar
    .filter((game) => game.id !== g.id)
    .slice(0, 4)
    .map(toGame),
});
