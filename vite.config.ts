import path from "node:path";
import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as games from "./api/games.ts";
import * as genres from "./api/genres.ts";
import * as platforms from "./api/platforms.ts";
import * as game from "./api/game.ts";
import * as stores from "./api/stores.ts";

const routes: Record<string, (request: Request) => Promise<Response>> = {
  "/api/games": games.GET,
  "/api/genres": genres.GET,
  "/api/platforms": platforms.GET,
  "/api/game": game.GET,
  "/api/stores": stores.GET,
};

function apiRoutes(): Plugin {
  const handle: Connect.NextHandleFunction = async (req, res, next) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const route = routes[url.pathname];
    if (!route) return next();
    try {
      const response = await route(new Request(url));
      res.statusCode = response.status;
      response.headers.forEach((value, name) => res.setHeader(name, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  };

  return {
    name: "api-routes",
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
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
