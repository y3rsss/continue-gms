import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Tag } from "lucide-react";
import { BACKLOG_SORTS, isOnSale, sortEntries, type BacklogSort } from "@/lib/sale";
import { STATUS_STYLE } from "@/lib/status";
import { cn } from "@/lib/utils";
import { STATUSES, type BacklogEntry, type Status } from "../hooks/useBacklog";
import { usePrices } from "../hooks/usePrice";
import FilterMenu from "./FilterMenu";
import GameCard, { GameCardSkeleton } from "./GameCard";
import Tab from "./Tab";

const order = Object.keys(STATUSES) as Status[];
const sorts = Object.keys(BACKLOG_SORTS) as BacklogSort[];
const sortOptions = sorts.map((value) => ({ value, label: BACKLOG_SORTS[value] }));
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

const Notice = ({ children }: { children: ReactNode }) => (
  <div className="grid justify-items-start gap-3 border-t-[1.5px] border-ink py-8">{children}</div>
);

interface Props {
  entries: BacklogEntry[];
  loading?: boolean;
  empty: ReactNode;
}

const BacklogView = ({ entries, loading, empty }: Props) => {
  const [params, setParams] = useSearchParams();
  const filter = order.find((s) => s === params.get("status"));
  const sale = params.has("sale");
  const sort = sorts.find((s) => s === params.get("sort")) ?? "recent";
  const inStatus = filter ? entries.filter((e) => e.status === filter) : entries;
  const { prices, pending, failed } = usePrices(inStatus.map((e) => e.game.slug));
  const onSale = inStatus.filter((e) => isOnSale(prices[e.game.slug]));
  const shown = sortEntries(sale ? onSale : inStatus, prices, sort);
  const tally = (status: Status) => entries.filter((e) => e.status === status).length;
  const needsPrices = sale || sort !== "recent";

  const setParam = (key: string, value: string | undefined) =>
    setParams((current) => {
      if (value === undefined) current.delete(key);
      else current.set(key, value);
      return current;
    });

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Tab active={!filter} onClick={() => setParam("status", undefined)}>
            All {entries.length}
          </Tab>
          {order.map((status) => (
            <Tab key={status} active={filter === status} onClick={() => setParam("status", status)}>
              <span aria-hidden className={cn("size-2.5 shrink-0", STATUS_STYLE[status].swatch)} />
              {STATUSES[status]} {tally(status)}
            </Tab>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Tab active={sale} onClick={() => setParam("sale", sale ? undefined : "1")}>
            <Tag aria-hidden className="size-3 shrink-0" strokeWidth={2.5} />
            On sale {!pending && !failed && onSale.length}
          </Tab>
          <FilterMenu
            label="Sorted by"
            options={sortOptions}
            value={sort}
            onChange={(value) => setParam("sort", value === "recent" ? undefined : value)}
          />
        </div>
      </div>

      {(loading && shown.length === 0) || (needsPrices && pending) ? (
        <div className={GRID}>
          {Array.from({ length: 8 }, (_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : sale && failed ? (
        <Notice>
          <p className="max-w-[52ch] font-body text-lg">
            Couldn't load prices. Check your connection and reload the page.
          </p>
        </Notice>
      ) : shown.length > 0 ? (
        <div className={GRID}>
          {shown.map((entry) => (
            <GameCard key={entry.game.slug} game={entry.game} status={entry.status} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Notice>{empty}</Notice>
      ) : (
        <Notice>
          <p className="max-w-[52ch] font-body text-lg">
            {inStatus.length === 0
              ? `No games marked “${STATUSES[filter!]}” yet.`
              : "Nothing here is on sale right now."}
          </p>
        </Notice>
      )}
    </>
  );
};

export default BacklogView;
