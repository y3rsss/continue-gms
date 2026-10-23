import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Game } from "@shared/types";
import { getJson } from "../services/api";
import useDebounce from "./useDebounce";

const useSearch = (query: string) => {
  const term = useDebounce(query.trim(), 250);
  const ready = term.length >= 2;

  const search = useQuery({
    queryKey: ["search", term],
    queryFn: ({ signal }) => getJson<{ results: Game[] }>("/api/search", { q: term }, signal),
    enabled: ready,
    staleTime: 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return { ...search, term, ready };
};

export default useSearch;
