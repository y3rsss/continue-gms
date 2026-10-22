import fs from "node:fs";
import path from "node:path";
import { createServer, defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

type Endpoint = { GET: (request: Request) => Promise<Response> };

// /api/<name> runs api/<name>.ts, like on Vercel; files in api/_lib aren't routes
const API_ROUTE = /^\/api\/([a-z-]+)$/;

function apiRoutes(): Plugin {
  const handler =
    (load: (file: string) => Promise<Record<string, unknown>>): Connect.NextHandleFunction =>
    async (req, res, next) => {
      const url = new URL(req.url ?? "/", "http://localhost");
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
