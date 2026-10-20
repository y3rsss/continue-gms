import { createBrowserRouter } from "react-router";
import Layout from "./pages/Layout";
import HomePage from "./pages/HomePage";
import GamesPage from "./pages/GamesPage";
import GamePage from "./pages/GamePage";
import BacklogPage from "./pages/BacklogPage";
import ErrorPage from "./pages/ErrorPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "games", element: <GamesPage /> },
      { path: "games/:slug", element: <GamePage /> },
      { path: "backlog", element: <BacklogPage /> },
    ],
  },
]);

export default router;
