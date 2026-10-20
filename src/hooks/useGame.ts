import { useQuery } from "@tanstack/react-query";
import type { GameDetails } from "@shared/types";
import { getJson } from "../services/api";

const useGame = (slug: string | undefined) =>
  useQuery({
    queryKey: ["game", slug],
    queryFn: ({ signal }) => getJson<GameDetails>("/api/game", { slug }, signal),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
  });

export default useGame;
