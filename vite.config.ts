import fs from "node:fs";
import path from "node:path";
import { createServer, defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

type Endpoint = { GET: (request: Request) => Promise<Response> };

interface Rewrite {
  source: string;
  destination: string;
  has?: { type: string; key: string; value: string }[];
}

// /api/<name> runs api/<name>.ts, like on Vercel; files in api/_lib aren't routes
const API_ROUTE = /^\/api\/([a-z-]+)$/;

// the conditional rewrites from vercel.json (link-preview bots), so dev routes like production
const conditionalRewrites = (
  JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "vercel.json"), "utf8")) as {
    rewrites: Rewrite[];
  }
).rewrites.filter((rule) => rule.has);

function rewrite(pathname: string, headers: Record<string, string | string[] | undefined>): string | null {
  for (const rule of conditionalRewrites) {
    const params: string[] = [];
    const source = rule.source.replace(/:(\w+)/g, (_, name: string) => {
      params.push(name);
      return "([^/]+)";
    });
    const match = pathname.match(new RegExp(`^${source}$`));
    const passes = rule.has!.every(
      (condition) =>
        condition.type === "header" && new RegExp(condition.value).test(String(headers[condition.key] ?? "")),
    );
    if (match && passes) {
      return params.reduce((target, name, i) => target.replace(`:${name}`, match[i + 1]), rule.destination);
    }
  }
  return null;
}

function apiRoutes(): Plugin {
  const handler =
    (load: (file: string) => Promise<Record<string, unknown>>): Connect.NextHandleFunction =>
    async (req, res, next) => {
      let url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      const target = rewrite(url.pathname, req.headers);
      if (target) url = new URL(target, url);
      const name = url.pathname.match(API_ROUTE)?.[1];
      if (!name || !fs.existsSync(path.resolve(import.meta.dirname, "api", `${name}.ts`))) return next();
      try {
        const { GET } = (await load(`/api/${name}.ts`)) as Endpoint;
        const response = await GET(new Request(url));
        res.statusCode = response.status;
        response.headers.forEach((value, header) => res.setHeader(header, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        next(error);
      }
    };

  return {
    name: "api-routes",
    configureServer: (server) => void server.middlewares.use(handler((file) => server.ssrLoadModule(file))),
    async configurePreviewServer(server) {
      const loader = await createServer({
        configFile: false,
        appType: "custom",
        server: { middlewareMode: true, hmr: false },
      });
      server.httpServer.once("close", () => void loader.close());
      server.middlewares.use(handler((file) => loader.ssrLoadModule(file)));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  for (const [name, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    process.env[name] ??= value;
  }

  return {
    plugins: [react(), tailwindcss(), apiRoutes()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@shared": path.resolve(import.meta.dirname, "./shared"),
      },
    },
  };
});
