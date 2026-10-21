import { useEffect, useRef } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type { GamesPage } from "@shared/types";
import GameCard, { GameCardSkeleton } from "./GameCard";
import GameRow, { GameRowSkeleton, ROW_GRID } from "./GameRow";

export type View = "list" | "grid";

interface Props {
  view: View;
  data: InfiniteData<GamesPage> | undefined;
  error: Error | null;
  isPending: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

const placeholders = Array.from({ length: 8 }, (_, i) => i);

const GameResults = ({
  view,
  data,
  error,
  isPending,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) => {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "800px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (error) {
    return (
      <p className="border-t-[1.5px] border-ink py-6 font-body text-faded">
        {error.message}. Try again in a moment.
      </p>
    );
  }

  const games = data?.pages.flatMap((page) => page.results) ?? [];
  if (!isPending && games.length === 0) {
    return (
      <p className="border-t-[1.5px] border-ink py-6 font-body text-faded">
        No games match these filters. Try removing one.
      </p>
    );
  }

  const loading = isPending || isFetchingNextPage;

  return (
    <div>
      {view === "list" ? (
        <div className="grid">
          <div className={`${ROW_GRID} label pb-1.5 text-[10px] text-faded`}>
            <span>No.</span>
            <span />
            <span>Game</span>
            <span className="hidden sm:block">Year</span>
            <span className="hidden lg:block">Platforms</span>
            <span className="text-center">Score</span>
          </div>
          {games.map((game, i) => (
            <GameRow key={game.id} game={game} rank={i + 1} />
          ))}
          {loading && placeholders.map((i) => <GameRowSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
          {loading && placeholders.map((i) => <GameCardSkeleton key={i} />)}
        </div>
      )}
      <div ref={sentinel} className="h-px" />
    </div>
  );
};

export default GameResults;
