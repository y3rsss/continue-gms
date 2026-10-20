import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import useGameQuery from "../hooks/useGameQuery";

const SearchBox = ({ className }: { className?: string }) => {
  const { query, setQuery } = useGameQuery();

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const search = new FormData(event.currentTarget).get("search");
        setQuery({ search: String(search ?? "").trim() });
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faded" />
      <input
        // remount on URL change (e.g. back button) to sync the value
        key={query.search}
        name="search"
        type="search"
        defaultValue={query.search}
        placeholder="Search games"
        aria-label="Search games"
        className="label w-full border-[1.5px] border-ink bg-transparent py-2 pr-3 pl-8 normal-case placeholder:text-faded placeholder:uppercase focus:outline-2 focus:outline-offset-2 focus:outline-house"
      />
    </form>
  );
};

export default SearchBox;
