import { useQuery } from "@tanstack/react-query";
import type { WhereToBuy } from "@shared/types";
import { getJson } from "../services/api";

const useStores = (slug: string | undefined) =>
  useQuery({
    queryKey: ["stores", slug],
    queryFn: ({ signal }) => getJson<WhereToBuy>("/api/stores", { slug }, signal),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
  });

export default useStores;
