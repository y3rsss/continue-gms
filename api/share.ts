import { firstSentence, money, monthYear, percentOff } from "../shared/format.js";
import type { WhereToBuy } from "../shared/types.js";
import { escapeHtml } from "./_lib/html.js";
import { SLUG, UpstreamError, cacheFor } from "./_lib/http.js";
import { whereToBuy } from "./_lib/offers.js";
import { rawgFetch, rawgImage, type RawgGameDetails } from "./_lib/rawg.js";

const SITE = "Continue?";
const TAGLINE = "The video game index. Browse games, compare scores and keep a backlog.";

interface Preview {
  title: string;
  description: string;
  url: string;
  image: string;
}

function page({ title, description, url, image }: Preview, status = 200): Response {
  const [t, d, u, i] = [title, description, url, image].map(escapeHtml);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${t} | ${SITE}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${i}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
  </head>
  <body>
    <h1>${t}</h1>
    <p>${d}</p>
    <a href="${u}">Open on ${SITE}</a>
  </body>
</html>
`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...cacheFor(60 * 60) },
  });
}

function priceLine(buy: WhereToBuy | null): string | null {
  const best = buy?.offers.find((offer) => offer.price !== null);
  if (!best || best.price === null) return null;
  if (best.price === 0) return `Free on ${best.store}.`;

  const off = best.regularPrice ? percentOff(best.price, best.regularPrice) : 0;
  const sale = off > 0 ? ` (${off}% off)` : "";
  const record = buy?.lowestEver && best.price <= buy.lowestEver.price ? " Lowest price ever." : "";
  return `From ${money(best.price)} on ${best.store}${sale}.${record}`;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const fallback: Preview = {
    title: SITE,
    description: TAGLINE,
    url: url.origin,
    image: `${url.origin}/og.png`,
  };

  if (!SLUG.test(slug)) return page({ ...fallback, title: "Game not found" }, 404);

  try {
    const [game, buy] = await Promise.all([
      rawgFetch<RawgGameDetails>(`games/${slug}`),
      whereToBuy(slug).catch(() => null),
    ]);

    const facts = [
      game.metacritic ? `Metascore ${game.metacritic}.` : null,
      game.genres?.length ? `${game.genres.map((g) => g.name).join(", ")}.` : null,
      game.released ? `Released ${monthYear(game.released)}.` : null,
      priceLine(buy),
      game.description_raw ? firstSentence(game.description_raw, 140) : null,
    ];

    return page({
      title: game.name,
      description: facts.filter(Boolean).join(" "),
      url: `${url.origin}/games/${slug}`,
      image: rawgImage(game.background_image, "hero") ?? fallback.image,
    });
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) {
      return page({ ...fallback, title: "Game not found" }, 404);
    }
    console.error(error);
    return page({ ...fallback, url: `${url.origin}/games/${slug}` });
  }
}
