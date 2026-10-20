import type { Game, Genre, Platform, SortOption } from "../../shared/types.js";

const BASE_URL = "https://api.rawg.io/api/";

export class UpstreamError extends Error {
  constructor(public status: number) {
    super(`RAWG responded with ${status}`);
  }
}

export async function rawgFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY is not set");

  const url = new URL(path, BASE_URL);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  }
  url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) throw new UpstreamError(response.status);
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

export const SORT_ORDERING: Record<SortOption, string | undefined> = {
  relevance: undefined,
  newest: "-released",
  added: "-added",
  rating: "-rating",
  metascore: "-metacritic",
  name: "name",
};

// RAWG's CDN only serves these sizes, anything else 404s
const IMAGE_SIZES = { card: "crop/600/400", thumb: "resize/200/-" } as const;

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
  rating_top: number;
}

export interface RawgList<T> {
  count: number;
  next: string | null;
  results: T[];
}

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
  ratingTop: g.rating_top,
});
