import { describe, expect, it } from "vitest";
import type { Price } from "@shared/types";
import type { BacklogEntry } from "../hooks/useBacklog";
import { isOnSale, sortEntries } from "./sale";

const price = (amount: number, regular: number): Price => ({ amount, regular, store: "Steam" });

const entry = (slug: string): BacklogEntry => ({
  status: "want",
  game: {
    id: 1,
    slug,
    name: slug,
    image: null,
    released: null,
    platforms: [],
    genres: [],
    metascore: null,
    rating: 0,
  },
  updatedAt: 0,
});

const slugs = (entries: BacklogEntry[]) => entries.map((e) => e.game.slug);

describe("isOnSale", () => {
  it("is true for a discounted price", () => {
    expect(isOnSale(price(4.99, 19.99))).toBe(true);
  });

  it("is true for a paid game that is free for now", () => {
    expect(isOnSale(price(0, 19.99))).toBe(true);
  });

  it("is false for full price, free to play and no price", () => {
    expect(isOnSale(price(19.99, 19.99))).toBe(false);
    expect(isOnSale(price(0, 0))).toBe(false);
    expect(isOnSale(null)).toBe(false);
    expect(isOnSale(undefined)).toBe(false);
  });
});

describe("sortEntries", () => {
  const entries = ["full", "none", "half", "most", "loading"].map(entry);
  const prices = {
    full: price(20, 20),
    none: null,
    half: price(10, 20),
    most: price(15, 60),
  };

  it("keeps the given order for recent", () => {
    expect(sortEntries(entries, prices, "recent")).toBe(entries);
  });

  it("puts the biggest discount first and games without a price last", () => {
    expect(slugs(sortEntries(entries, prices, "discount"))).toEqual([
      "most",
      "half",
      "full",
      "none",
      "loading",
    ]);
  });

  it("puts the lowest price first and games without a price last", () => {
    expect(slugs(sortEntries(entries, prices, "price"))).toEqual(["half", "most", "full", "none", "loading"]);
  });

  it("keeps the given order between equal games", () => {
    const tied = ["b", "a", "c"].map(entry);
    const same = { a: price(5, 10), b: price(5, 10), c: price(5, 10) };
    expect(slugs(sortEntries(tied, same, "discount"))).toEqual(["b", "a", "c"]);
  });

  it("leaves the original list alone", () => {
    const before = slugs(entries);
    sortEntries(entries, prices, "price");
    expect(slugs(entries)).toEqual(before);
  });
});
