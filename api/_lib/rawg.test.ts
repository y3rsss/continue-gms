import { describe, expect, it } from "vitest";
import type { Media } from "../../shared/types.js";
import {
  steamAppId,
  toGameDetails,
  toStoreOffer,
  type RawgGame,
  type RawgGameDetails,
  type RawgMovie,
  type RawgScreenshot,
} from "./rawg.js";

const image = (name: string) => `https://media.rawg.io/media/games/abc/${name}.jpg`;

const details: RawgGameDetails = {
  id: 1,
  slug: "hollow-knight",
  name: "Hollow Knight",
  background_image: image("main"),
  background_image_additional: image("extra"),
  released: "2017-02-23",
  metacritic: 88,
  rating: 4.4,
  description_raw: "  A game.  ",
  developers: [{ name: "Team Cherry" }],
  publishers: null,
  website: "",
};

const screenshots: RawgScreenshot[] = [
  { id: 1, image: image("main") },
  { id: 2, image: image("shot-1") },
];

const movie = (id: number): RawgMovie => ({
  id,
  name: `Trailer ${id}`,
  preview: null,
  data: { "480": `https://cdn/${id}-480.mp4`, max: `https://cdn/${id}-max.mp4` },
});

const describeMedia = (media: Media[]) =>
  media.map((item) => (item.kind === "video" ? item.title : item.full.split("/").pop()));

describe("toGameDetails media", () => {
  it("puts the first trailer first, then the images, then the other trailers", () => {
    const { media } = toGameDetails(details, screenshots, [movie(1), movie(2)], []);
    expect(describeMedia(media)).toEqual(["Trailer 1", "main.jpg", "extra.jpg", "shot-1.jpg", "Trailer 2"]);
  });

  it("lists an image only once when RAWG repeats it as a screenshot", () => {
    const { media } = toGameDetails(details, screenshots, [], []);
    expect(describeMedia(media).filter((name) => name === "main.jpg")).toHaveLength(1);
  });

  it("offers each image in three sizes", () => {
    const [first] = toGameDetails(details, [], [], []).media;
    expect(first).toEqual({
      kind: "image",
      full: "https://media.rawg.io/media/resize/1920/-/games/abc/main.jpg",
      preview: "https://media.rawg.io/media/resize/640/-/games/abc/main.jpg",
      thumb: "https://media.rawg.io/media/resize/200/-/games/abc/main.jpg",
    });
  });
});

describe("toGameDetails", () => {
  it("cleans up the text fields", () => {
    const game = toGameDetails(details, [], [], []);
    expect(game.description).toBe("A game.");
    expect(game.developers).toEqual(["Team Cherry"]);
    expect(game.publishers).toEqual([]);
    expect(game.website).toBeNull();
  });

  it("suggests up to four other games, never the game itself", () => {
    const others: RawgGame[] = Array.from({ length: 6 }, (_, i) => ({
      ...details,
      id: i,
      slug: `game-${i}`,
    }));
    const { similar } = toGameDetails(details, [], [], others);
    expect(similar).toHaveLength(4);
    expect(similar.some((game) => game.id === details.id)).toBe(false);
  });
});

describe("toStoreOffer", () => {
  it("names the store and upgrades the link to https", () => {
    expect(toStoreOffer({ store_id: 5, url: "http://www.gog.com/game/hollow_knight" })).toEqual({
      store: "GOG",
      url: "https://www.gog.com/game/hollow_knight",
      price: null,
      regularPrice: null,
    });
  });

  it("falls back to a generic name for stores it doesn't know", () => {
    expect(toStoreOffer({ store_id: 42, url: "https://example.com" }).store).toBe("Other store");
  });
});

describe("steamAppId", () => {
  it("reads the app id from a Steam store link", () => {
    expect(steamAppId("https://store.steampowered.com/app/367520/")).toBe("367520");
    expect(steamAppId("http://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/")).toBe("292030");
  });

  it("returns null for links that aren't Steam games", () => {
    expect(steamAppId("https://www.gog.com/game/hollow_knight")).toBeNull();
    expect(steamAppId("https://store.steampowered.com/bundle/123/")).toBeNull();
    expect(steamAppId("")).toBeNull();
  });
});
