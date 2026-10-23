import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import { Dialog } from "radix-ui";
import { ArrowRight, Search } from "lucide-react";
import { platformAbbr, year } from "@/lib/format";
import { readRecent, type RecentGame } from "@/lib/recent";
import useSearch from "../hooks/useSearch";
import Meta from "./Meta";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const ITEM =
  "group flex cursor-pointer items-center gap-3 px-2 py-2 data-[selected=true]:bg-ink data-[selected=true]:text-paper";

const GameItem = ({ game, onSelect }: { game: RecentGame; onSelect: () => void }) => (
  <Command.Item value={game.slug} onSelect={onSelect} className={ITEM}>
    <span className="aspect-[3/2] w-16 shrink-0 overflow-hidden border-[1.5px] border-ink bg-tint">
      {game.image && <img src={game.image} alt="" loading="lazy" className="size-full object-cover" />}
    </span>
    <span className="grid min-w-0 flex-1 gap-0.5">
      <span className="narrow truncate text-lg leading-tight font-extrabold uppercase">{game.name}</span>
      <Meta
        items={[year(game.released), platformAbbr(game.platforms)]}
        className="group-data-[selected=true]:text-paper/70"
      />
    </span>
    {game.metascore !== null && (
      <span
        className={`wide shrink-0 text-lg font-black tabular-nums ${game.metascore >= 90 ? "text-house" : ""}`}
      >
        {game.metascore}
      </span>
    )}
  </Command.Item>
);

const Note = ({ children }: { children: ReactNode }) => (
  <p className="px-2 py-6 text-center font-body text-faded">{children}</p>
);

const Key = ({ children }: { children: ReactNode }) => (
  <kbd className="border border-faded/50 px-1 font-mono text-[10px]">{children}</kbd>
);

const SearchPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data, isFetching, isPending, ready, term } = useSearch(query);
  const recent = useMemo(() => (open ? readRecent() : []), [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const show = (next: boolean) => {
    setOpen(next);
    setQuery("");
  };

  const go = (path: string) => {
    show(false);
    navigate(path);
  };

  const results = ready ? (data?.results ?? []) : [];
  const typed = query.trim();

  return (
    <Dialog.Root open={open} onOpenChange={show}>
      <Dialog.Trigger className="label flex w-full items-center gap-2 border-[1.5px] border-ink px-3 py-2 text-faded hover:bg-tint sm:w-64">
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search games</span>
        <span className="hidden sm:inline">
          <Key>{isMac ? "⌘ K" : "Ctrl K"}</Key>
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#15171c]/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[8vh] left-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 border-[3px] border-ink bg-paper text-ink shadow-[8px_8px_0_var(--ink)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">Search games</Dialog.Title>
          <Command shouldFilter={false} label="Search games">
            <div className="flex items-center gap-3 border-b-[3px] border-ink px-4">
              <Search className="size-5 shrink-0 text-faded" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search games"
                className="narrow h-14 w-full bg-transparent text-2xl font-extrabold uppercase outline-none placeholder:text-faded/60"
              />
              {ready && isFetching && <span className="size-2 shrink-0 animate-pulse bg-house" />}
            </div>

            <Command.List className="max-h-[min(60vh,520px)] overflow-y-auto p-2">
              {!ready && recent.length > 0 && (
                <Command.Group
                  heading="Recently viewed"
                  className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-faded"
                >
                  {recent.map((game) => (
                    <GameItem key={game.slug} game={game} onSelect={() => go(`/games/${game.slug}`)} />
                  ))}
                </Command.Group>
              )}
              {!ready && recent.length === 0 && (
                <Note>{typed ? "Keep typing…" : "Find any game by name. Try “elden” or “zelda”."}</Note>
              )}

              {ready && isPending && <Note>Searching…</Note>}
              {ready && !isPending && results.length === 0 && !isFetching && (
                <Note>No games found for “{term}”.</Note>
              )}
              {results.map((game) => (
                <GameItem key={game.slug} game={game} onSelect={() => go(`/games/${game.slug}`)} />
              ))}
              {ready && results.length > 0 && (
                <Command.Item
                  value="__all"
                  onSelect={() => go(`/games?search=${encodeURIComponent(typed)}`)}
                  className={`${ITEM} label mt-1 justify-between border-t-[1.5px] border-ink pt-3`}
                >
                  See all results for “{typed}”
                  <ArrowRight className="size-3.5" />
                </Command.Item>
              )}
            </Command.List>

            <div className="label hidden items-center gap-4 border-t-[1.5px] border-ink px-4 py-2 text-[10px] text-faded sm:flex">
              <span className="flex items-center gap-1">
                <Key>↑</Key>
                <Key>↓</Key> move
              </span>
              <span className="flex items-center gap-1">
                <Key>↵</Key> open
              </span>
              <span className="flex items-center gap-1">
                <Key>esc</Key> close
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SearchPalette;
