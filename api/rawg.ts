const RAWG_BASE_URL = "https://api.rawg.io/api/";
const SAFE_PATH = /^[a-z0-9\-/]+$/i;

export async function GET(request: Request): Promise<Response> {
  const key = process.env.RAWG_API_KEY;
  if (!key) {
    return Response.json({ error: "RAWG_API_KEY is not set" }, { status: 500 });
  }

  const url = new URL(request.url);
  const path = (
    url.searchParams.get("path") ?? url.pathname.replace(/^\/api\/rawg/, "")
  ).replace(/^\/+|\/+$/g, "");

  if (!SAFE_PATH.test(path)) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  const target = new URL(path, RAWG_BASE_URL);
  url.searchParams.forEach((value, name) => {
    if (name !== "path" && name !== "key") target.searchParams.append(name, value);
  });
  target.searchParams.set("key", key);

  let upstream: Response;
  try {
    upstream = await fetch(target);
  } catch {
    return Response.json({ error: "RAWG is unreachable" }, { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      ...(upstream.ok && {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      }),
    },
  });
}
