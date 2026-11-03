import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";
import router from "./routes";
import { ApiError } from "./services/api";
import Overlays from "./components/Overlays";
import { announceAuthRedirect } from "./lib/auth-redirect";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failures, error) => {
        if (!(error instanceof ApiError)) return failures < 3;
        return error.status >= 500 && failures < 1;
      },
    },
  },
});

announceAuthRedirect();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Overlays />
    </QueryClientProvider>
  </StrictMode>,
);
