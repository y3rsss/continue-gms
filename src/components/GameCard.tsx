import { Link } from "react-router";
import type { Game } from "@shared/types";
import { platformAbbr, year } from "@/lib/format";
import Meta from "./Meta";
import { useStatus } from "../hooks/useBacklog";
import Cover from "./Cover";
import Score from "./Score";
import StatusStamp from "./StatusStamp";

const GameCard = ({ game }: { game: Game }) => {
  const status = useStatus(game.slug);

  return (
    <Link to={`/games/${game.slug}`} className="group grid min-w-0 content-start gap-2">
      <Cover src={game.image} alt={game.name}>
        {status && <StatusStamp status={status} />}
      </Cover>
      <span className="narrow text-[19px] leading-[1.05] font-extrabold uppercase group-hover:text-house">
        {game.name}
      </span>
      <span className="flex items-center justify-between gap-2.5">
        <Meta items={[year(game.released), platformAbbr(game.platforms)]} />
        <Score value={game.metascore} />
      </span>
    </Link>
  );
};

export const GameCardSkeleton = () => (
  <div className="grid content-start gap-2">
    <div className="aspect-[3/2] animate-pulse bg-tint" />
    <div className="h-5 w-3/4 animate-pulse bg-tint" />
    <div className="h-3 w-1/2 animate-pulse bg-tint" />
  </div>
);

export default GameCard;
