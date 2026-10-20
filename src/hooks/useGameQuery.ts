import { useNavigate, useSearchParams } from "react-router";
import { SORT_OPTIONS, type SortOption } from "@shared/types";

export interface GameQuery {
  genre?: string;
  platform?: string;
  sort?: SortOption;
  search?: string;
}

const useGameQuery = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sort = params.get("sort");
  const query: GameQuery = {
    genre: params.get("genre") ?? undefined,
    platform: params.get("platform") ?? undefined,
    sort: sort && sort in SORT_OPTIONS ? (sort as SortOption) : undefined,
    search: params.get("search") ?? undefined,
  };

  const setQuery = (changes: Partial<GameQuery>) => {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    navigate({ pathname: "/", search: next.toString() });
  };

  return { query, setQuery };
};

export default useGameQuery;
