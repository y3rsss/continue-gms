export interface Platform {
  slug: string;
  name: string;
}

export interface Genre {
  slug: string;
  name: string;
  image: string | null;
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  released: string | null;
  platforms: Platform[];
  genres: Omit<Genre, "image">[];
  /** 0-100 */
  metascore: number | null;
  /** 0-5 */
  rating: number;
}

export interface GameDetails extends Game {
  hero: string | null;
  description: string;
  developers: string[];
  publishers: string[];
  website: string | null;
  screenshots: string[];
  similar: Game[];
}

export interface StoreOffer {
  store: string;
  url: string;
  /** USD, null when the store has no price data (consoles, mobile) */
  price: number | null;
  regularPrice: number | null;
}

export interface WhereToBuy {
  offers: StoreOffer[];
  lowestEver: { price: number; date: string } | null;
}

export interface GamesPage {
  results: Game[];
  count: number;
  nextPage: number | null;
}

export const SORT_OPTIONS = {
  relevance: "Relevance",
  newest: "Release date",
  added: "Popularity",
  rating: "User rating",
  metascore: "Metascore",
  name: "Name",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export const LISTS = ["trending", "new", "greats"] as const;

export type List = (typeof LISTS)[number];
