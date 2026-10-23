import { Link, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import GameCard from "../components/GameCard";
import { STATUS_STYLE } from "@/lib/status";
import { cn } from "@/lib/utils";
import Tab from "../components/Tab";
import { STATUSES, useBacklog, type Status } from "../hooks/useBacklog";

const order = Object.keys(STATUSES) as Status[];

const BacklogPage = () => {
  const backlog = useBacklog();
  const [params, setParams] = useSearchParams();
  const filter = order.find((s) => s === params.get("status"));

  const entries = Object.values(backlog).sort((a, b) => b.updatedAt - a.updatedAt);
  const shown = filter ? entries.filter((e) => e.status === filter) : entries;
  const tally = (status: Status) => entries.filter((e) => e.status === status).length;

  return (
    <div className="grid gap-5 px-4 pt-6 pb-12 sm:px-7">
      <title>My backlog | Continue?</title>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-[6px] border-ink pb-2.5">
        <h1 className="wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
          My backlog
        </h1>
        {entries.length > 0 && (
          <span className="label text-faded">
            {entries.length} {entries.length === 1 ? "game" : "games"}
          </span>
        )}
      </header>

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

      {shown.length === 0 ? (
        <div className="grid justify-items-start gap-3 border-t-[1.5px] border-ink py-8">
          <p className="max-w-[52ch] font-body text-lg">
            {entries.length === 0
              ? "Nothing here yet. Open any game and stamp it: Want to play, Playing, Finished or Dropped."
              : `No games marked “${STATUSES[filter!]}” yet.`}
          </p>
          <Link
            to="/games"
            className="label inline-flex items-center gap-1.5 border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper"
          >
            Browse the index
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((entry) => (
            <GameCard key={entry.game.slug} game={entry.game} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BacklogPage;
