import { Link } from "react-router";
import type { Game } from "@shared/types";
import { platformAbbr, year } from "@/lib/format";
import { useStatus } from "../hooks/useBacklog";
import StatusStamp from "./StatusStamp";
import Cover from "./Cover";
import Score from "./Score";

export const ROW_GRID =
  "grid grid-cols-[34px_48px_minmax(0,1fr)_48px] items-center gap-3 sm:grid-cols-[52px_64px_minmax(0,1fr)_64px_56px] sm:gap-4 lg:grid-cols-[52px_64px_minmax(0,1fr)_64px_170px_56px]";

const GameRow = ({ game, rank }: { game: Game; rank: number }) => {
  const status = useStatus(game.slug);

  return (
    <Link
      to={`/games/${game.slug}`}
      className={`${ROW_GRID} group border-t-[1.5px] border-ink py-2.5 odd:bg-tint`}
    >
      <span className="wide pl-1 text-xl leading-none font-black tracking-tighter tabular-nums sm:text-[28px]">
        {String(rank).padStart(2, "0")}
      </span>
      <Cover src={game.image} alt="" className="aspect-square" />
      <span className="grid min-w-0">
        <b className="narrow truncate text-base leading-[1.1] font-extrabold uppercase group-hover:text-house sm:text-[19px]">
          {game.name}
        </b>
        <span className="truncate font-body text-[12.5px] text-faded">
          {status && <StatusStamp status={status} small />}
          {game.genres.map((g) => g.name).join(", ")}
        </span>
      </span>
      <span className="label hidden sm:block">{year(game.released)}</span>
      <span className="label hidden truncate lg:block">{platformAbbr(game.platforms)}</span>
      <Score value={game.metascore} large />
    </Link>
  );
};

export const GameRowSkeleton = () => (
  <div className={`${ROW_GRID} border-t-[1.5px] border-ink py-2.5`}>
    <div className="h-6 animate-pulse bg-tint" />
    <div className="aspect-square animate-pulse bg-tint" />
    <div className="h-5 w-2/3 animate-pulse bg-tint" />
    <div className="h-8 animate-pulse bg-tint" />
  </div>
);

export default GameRow;
