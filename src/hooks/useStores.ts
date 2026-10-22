import { useQuery } from "@tanstack/react-query";
import type { StoreLink } from "@shared/types";
import { getJson } from "../services/api";

const useStores = (slug: string | undefined) =>
  useQuery({
    queryKey: ["stores", slug],
    queryFn: ({ signal }) => getJson<StoreLink[]>("/api/stores", { slug }, signal),
    enabled: !!slug,
    staleTime: 24 * 60 * 60 * 1000,
  });

export default useStores;
