import { useInfiniteQuery } from "@tanstack/react-query";
import type { GamesPage } from "@shared/types";
import { getJson } from "../services/api";
import type { GameQuery } from "./useGameQuery";

const useGames = (query: GameQuery) =>
  useInfiniteQuery({
    queryKey: ["games", query],
    queryFn: ({ pageParam, signal }) =>
      getJson<GamesPage>("/api/games", { ...query, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

export default useGames;
