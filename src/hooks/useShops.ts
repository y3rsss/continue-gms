import { useQuery } from "@tanstack/react-query";
import type { Shop } from "@shared/types";
import { getJson } from "../services/api";

const useShops = (enabled: boolean) =>
  useQuery({
    queryKey: ["shops"],
    queryFn: ({ signal }) => getJson<Shop[]>("/api/shops", {}, signal),
    staleTime: 24 * 60 * 60 * 1000,
    enabled,
  });

export default useShops;
