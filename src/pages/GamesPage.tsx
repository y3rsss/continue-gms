import { X } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "@shared/types";
import { count } from "@/lib/format";
import FilterMenu from "../components/FilterMenu";
import GameResults, { type View } from "../components/GameResults";
import GenreTabs from "../components/GenreTabs";
import Tab from "../components/Tab";
import useGameQuery from "../hooks/useGameQuery";
import useGames from "../hooks/useGames";
import useGenres from "../hooks/useGenres";
import usePlatforms from "../hooks/usePlatforms";
import useStoredState from "../hooks/useStoredState";

const sortOptions = Object.entries(SORT_OPTIONS).map(([value, label]) => ({
  value: value === "relevance" ? undefined : value,
  label,
}));

const GamesPage = () => {
  const { query, setQuery } = useGameQuery();
  const games = useGames(query);
  const genre = useGenres().data?.find((g) => g.slug === query.genre);
  const platforms = usePlatforms().data;
  const platform = platforms?.find((p) => p.slug === query.platform);
  const [view, setView] = useStoredState<View>("continue.view", "list", ["list", "grid"]);

  const heading = query.search
    ? `“${query.search}”`
    : [platform?.name, genre?.name ?? (platform ? "" : "All"), "games"].filter(Boolean).join(" ");
  const total = games.data?.pages[0]?.count;

  return (
    <div className="grid gap-5 px-4 pt-6 pb-12 sm:px-7">
      <title>{`${heading} | Continue?`}</title>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-[6px] border-ink pb-2.5">
        <h1 className="wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
          {heading}
        </h1>
        {total === undefined ? (
          <span className="h-3 w-24 animate-pulse bg-tint" />
        ) : (
          <span className="label text-faded">{count(total)} games</span>
        )}
      </header>

      <GenreTabs />

      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          label="Platform"
          options={[
            { value: undefined, label: "All" },
            ...(platforms ?? []).map((p) => ({ value: p.slug, label: p.name })),
          ]}
          value={query.platform}
          onChange={(value) => setQuery({ platform: value })}
        />
        <FilterMenu
          label="Ranked by"
          options={sortOptions}
          value={query.sort}
          onChange={(value) => setQuery({ sort: value as SortOption | undefined })}
        />
        {query.search && (
          <Tab onClick={() => setQuery({ search: undefined })}>
            Clear search
            <X className="size-3" strokeWidth={2.5} />
          </Tab>
        )}
        <div className="ml-auto flex" role="group" aria-label="View">
          <Tab active={view === "list"} onClick={() => setView("list")}>
            List
          </Tab>
          <Tab active={view === "grid"} onClick={() => setView("grid")} className="-ml-[1.5px]">
            Grid
          </Tab>
        </div>
      </div>

      <GameResults
        view={view}
        data={games.data}
        error={games.error}
        isPending={games.isPending}
        hasNextPage={games.hasNextPage}
        isFetchingNextPage={games.isFetchingNextPage}
        fetchNextPage={games.fetchNextPage}
      />
    </div>
  );
};

export default GamesPage;
