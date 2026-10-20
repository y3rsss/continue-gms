import { useQuery } from "@tanstack/react-query";
import type { Platform } from "@shared/types";
import { getJson } from "../services/api";

const usePlatforms = () =>
  useQuery({
    queryKey: ["platforms"],
    queryFn: ({ signal }) => getJson<Platform[]>("/api/platforms", {}, signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

export default usePlatforms;
