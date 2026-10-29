import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { STATUS_STYLE } from "@/lib/status";
import { cn } from "@/lib/utils";
import { STATUSES, type BacklogEntry, type Status } from "../hooks/useBacklog";
import GameCard, { GameCardSkeleton } from "./GameCard";
import Tab from "./Tab";

const order = Object.keys(STATUSES) as Status[];
const GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4";

export const BrowseLink = () => (
  <Link
    to="/games"
    className="label inline-flex items-center gap-1.5 border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper"
  >
    Browse the index
    <ArrowRight className="size-3.5" strokeWidth={2.5} />
  </Link>
);

interface Props {
  entries: BacklogEntry[];
  loading?: boolean;
  empty: ReactNode;
}

const BacklogView = ({ entries, loading, empty }: Props) => {
  const [params, setParams] = useSearchParams();
  const filter = order.find((s) => s === params.get("status"));
  const shown = filter ? entries.filter((e) => e.status === filter) : entries;
  const tally = (status: Status) => entries.filter((e) => e.status === status).length;

  return (
    <>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Tab active={!filter} onClick={() => setParams({})}>
          All {entries.length}
        </Tab>
        {order.map((status) => (
          <Tab key={status} active={filter === status} onClick={() => setParams({ status })}>
            <span aria-hidden className={cn("size-2.5 shrink-0", STATUS_STYLE[status].swatch)} />
            {STATUSES[status]} {tally(status)}
          </Tab>
        ))}
      </div>

      {loading && shown.length === 0 ? (
        <div className={GRID}>
          {Array.from({ length: 8 }, (_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="grid justify-items-start gap-3 border-t-[1.5px] border-ink py-8">
          {entries.length === 0 ? (
            empty
          ) : (
            <p className="max-w-[52ch] font-body text-lg">No games marked “{STATUSES[filter!]}” yet.</p>
          )}
        </div>
      ) : (
        <div className={GRID}>
          {shown.map((entry) => (
            <GameCard key={entry.game.slug} game={entry.game} status={entry.status} />
          ))}
        </div>
      )}
    </>
  );
};

export default BacklogView;
