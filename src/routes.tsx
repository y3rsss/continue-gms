import { createBrowserRouter } from "react-router";
import Layout from "./pages/Layout";
import HomePage from "./pages/HomePage";
import ErrorPage from "./pages/ErrorPage";

const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "games", lazy: page(() => import("./pages/GamesPage")) },
      { path: "games/:slug", lazy: page(() => import("./pages/GamePage")) },
      { path: "backlog", lazy: page(() => import("./pages/BacklogPage")) },
    ],
  },
]);

export default router;
