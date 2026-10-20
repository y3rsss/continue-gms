import { Link } from "react-router";
import type { Game } from "@shared/types";
import GameCard, { GameCardSkeleton } from "./GameCard";

interface Props {
  title: string;
  games: Game[] | undefined;
  more?: string;
}

const Rail = ({ title, games, more }: Props) => {
  return (
    <section className="grid gap-3.5">
      <div className="flex items-baseline justify-between gap-4 border-t-[3px] border-ink pt-2.5">
        <h2 className="wide text-[clamp(20px,2.6vw,28px)] leading-none font-black tracking-[-0.03em] uppercase">
          {title}
        </h2>
        {more && (
          <Link to={more} className="label whitespace-nowrap text-faded hover:text-house">
            See all →
          </Link>
        )}
      </div>
      <div className="-mx-4 grid auto-cols-[72%] grid-flow-col gap-4 overflow-x-auto px-4 pb-1.5 [scrollbar-width:thin] sm:mx-0 sm:auto-cols-[minmax(210px,1fr)] sm:px-0">
        {games
          ? games.map((game) => <GameCard key={game.id} game={game} />)
          : Array.from({ length: 5 }, (_, i) => <GameCardSkeleton key={i} />)}
      </div>
    </section>
  );
};

export default Rail;
