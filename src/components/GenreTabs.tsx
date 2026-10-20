import useGameQuery from "../hooks/useGameQuery";
import useGenres from "../hooks/useGenres";
import Tab from "./Tab";

const GenreTabs = () => {
  const { data, isPending } = useGenres();
  const { query, setQuery } = useGameQuery();

  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:px-0">
      <Tab active={!query.genre} onClick={() => setQuery({ genre: undefined })}>
        All
      </Tab>
      {isPending &&
        Array.from({ length: 8 }, (_, i) => <span key={i} className="h-7 w-20 shrink-0 animate-pulse bg-tint" />)}
      {data?.map((genre) => (
        <Tab key={genre.slug} active={genre.slug === query.genre} onClick={() => setQuery({ genre: genre.slug })}>
          {genre.name}
        </Tab>
      ))}
    </div>
  );
};

export default GenreTabs;
