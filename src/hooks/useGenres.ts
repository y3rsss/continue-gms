import { useQuery } from "@tanstack/react-query";
import type { Genre } from "@shared/types";
import { getJson } from "../services/api";

const useGenres = () =>
  useQuery({
    queryKey: ["genres"],
    queryFn: ({ signal }) => getJson<Genre[]>("/api/genres", {}, signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

export default useGenres;
