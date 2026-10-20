import path from "node:path";
import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { GET as rawgProxy } from "./api/rawg";

function apiRoutes(): Plugin {
  const handle: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url || !/^\/api\/rawg(\/|\?|$)/.test(req.url)) return next();
    try {
      const response = await rawgProxy(
        new Request(new URL(req.url, "http://localhost"))
      );
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
      },
    },
  };
});
