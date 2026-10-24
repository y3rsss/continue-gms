import { describe, expect, it } from "vitest";
import { steamAppId } from "./cheapshark.js";

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
