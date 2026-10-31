import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as share } from "../share.js";
import { fakeFetch } from "./fake-fetch.js";
import { deal } from "./fake-prices.js";

vi.mock("./price-store.js", async () => {
  const { memoryStore } = await import("./fake-prices.js");
  return { priceStore: () => memoryStore() };
});

const details = {
  id: 9767,
  slug: "hollow-knight",
  name: "Hollow Knight",
  background_image: "https://media.rawg.io/media/games/4cf/hollow.jpg",
  background_image_additional: null,
  released: "2017-02-23",
  metacritic: 88,
  rating: 4.4,
  genres: [{ id: 3, slug: "platformer", name: "Platformer", image_background: null }],
  description_raw: "Forge your own path in Hollow Knight! An epic action adventure.",
  website: null,
};

const steamLink = {
  count: 1,
  next: null,
  results: [{ store_id: 1, url: "https://store.steampowered.com/app/367520/" }],
};

function fakeApis(game: object | undefined, price = { now: 9.99, regular: 14.99, lowest: 2.99 }) {
  fakeFetch((url) => {
    if (url.hostname === "api.rawg.io") return url.pathname.endsWith("/stores") ? steamLink : game;
    if (url.pathname.startsWith("/lookup/")) return { "app/367520": "hk" };
    if (url.pathname === "/games/prices/v3")
      return [{ id: "hk", deals: [deal("Steam", price.now, price.regular)] }];
    return {
      prices: [{ id: "hk", lowest: { price: { amount: price.lowest }, timestamp: "2024-04-11T10:00:00Z" } }],
    };
  });
}

const preview = async (slug: string) => {
  const response = await share(new Request(`https://continue-gms.vercel.app/api/share?slug=${slug}`));
  return { response, html: await response.text() };
};

const meta = (html: string, property: string) =>
  html.match(new RegExp(`property="${property}" content="([^"]*)"`))?.[1];

beforeEach(() => {
  process.env.RAWG_API_KEY = "test-key";
  process.env.ITAD_API_KEY = "itad-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("link preview page", () => {
  it("describes the game with its score, genres, release and best price", async () => {
    fakeApis(details);
    const { response, html } = await preview("hollow-knight");
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(meta(html, "og:title")).toBe("Hollow Knight");
    expect(meta(html, "og:description")).toBe(
      "Metascore 88. Platformer. Released Feb 2017. From $9.99 on Steam (33% off). Forge your own path in Hollow Knight!",
    );
    expect(meta(html, "og:url")).toBe("https://continue-gms.vercel.app/games/hollow-knight");
    expect(meta(html, "og:image")).toBe("https://media.rawg.io/media/resize/1280/-/games/4cf/hollow.jpg");
  });

  it("mentions when today's price is the lowest ever", async () => {
    fakeApis(details, { now: 2.99, regular: 14.99, lowest: 2.99 });
    const { html } = await preview("hollow-knight");
    expect(meta(html, "og:description")).toContain("From $2.99 on Steam (80% off). Lowest price ever.");
  });

  it("escapes game names so they can't inject HTML", async () => {
    fakeApis({ ...details, name: `Evil"><script>alert(1)</script>` });
    const { html } = await preview("hollow-knight");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(meta(html, "og:title")).toBe("Evil&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("answers 404 with the default card for unknown games", async () => {
    fakeApis(undefined);
    const { response, html } = await preview("nope-nope");
    expect(response.status).toBe(404);
    expect(meta(html, "og:title")).toBe("Game not found");
    expect(meta(html, "og:image")).toBe("https://continue-gms.vercel.app/og.png");
  });

  it("answers 404 for slugs that aren't valid", async () => {
    fakeApis(details);
    expect((await preview("..%2Fsecret")).response.status).toBe(404);
  });
});
