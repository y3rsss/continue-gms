import { useQuery } from "@tanstack/react-query";
import type { GamesPage, List } from "@shared/types";
import { getJson } from "../services/api";

const useList = (list: List, size = 12) =>
  useQuery({
    queryKey: ["list", list, size],
    queryFn: ({ signal }) => getJson<GamesPage>("/api/games", { list, size }, signal),
    staleTime: 60 * 60 * 1000,
  });

export default useList;
