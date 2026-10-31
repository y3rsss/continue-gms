import { Link } from "react-router";
import type { Game } from "@shared/types";
import { platformAbbr, year } from "@/lib/format";
import Meta from "./Meta";
import { useStatus, type Status } from "../hooks/useBacklog";
import { usePrice } from "../hooks/usePrice";
import Cover from "./Cover";
import PriceTag from "./PriceTag";
import Score from "./Score";
import StatusStamp from "./StatusStamp";

// pass status to stamp someone else's backlog, otherwise it shows yours
const GameCard = ({ game, status: given }: { game: Game; status?: Status }) => {
  const own = useStatus(game.slug);
  const status = given ?? own;
  const { data: price } = usePrice(game.slug);

  return (
    <Link to={`/games/${game.slug}`} className="group grid min-w-0 grid-cols-1 content-start gap-2">
      <Cover src={game.image} alt={game.name}>
        {status && <StatusStamp status={status} />}
        {price && <PriceTag price={price} />}
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
