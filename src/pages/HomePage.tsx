import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { GamesPage } from "@shared/types";
import { count, firstSentence } from "@/lib/format";
import { getJson } from "../services/api";
import Rail from "../components/Rail";
import ScoreStamp from "../components/ScoreStamp";
import useGame from "../hooks/useGame";
import useList from "../hooks/useList";

const teasers = [
  { to: "/games?sort=metascore", title: "All-time greats", text: "Every game ranked by its Metascore" },
  {
    to: "/games?genre=role-playing-games-rpg&sort=metascore",
    title: "The best RPGs, ranked",
    text: "From the modern epics to the cult classics",
  },
  { to: "/games?genre=indie&sort=metascore", title: "Indie darlings", text: "Small teams, big scores" },
];

const HomePage = () => {
  const trending = useList("trending", 13);
  const fresh = useList("new");
  const greats = useList("greats");
  const total = useQuery({
    queryKey: ["total"],
    queryFn: ({ signal }) => getJson<GamesPage>("/api/games", { size: 1 }, signal),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const featured = trending.data?.results[0];
  const story = useGame(featured?.slug).data;
  const tagline = story ? firstSentence(story.description) : "";

  return (
    <div className="grid gap-9 px-4 pt-5 pb-12 sm:px-7">
      <title>Continue? | The video game index</title>
      <header className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="group wide text-[clamp(44px,10.5vw,132px)] leading-[0.8] font-black tracking-[-0.045em] uppercase">
            Continue
            <span className="inline-block animate-[blink_1s_steps(1)_3] text-house group-hover:animate-[blink_1s_steps(1)_infinite]">
              ?
            </span>
          </h1>
          {total.data ? (
            <span className="label leading-[1.8] sm:text-right">
              The index of
              <br />
              {count(total.data.count)} video games
            </span>
          ) : (
            <span className="h-8 w-40 animate-pulse bg-tint" />
          )}
        </div>

        <div className="border-t-[6px] border-ink pt-3">
          {featured ? (
            <Link
              to={`/games/${featured.slug}`}
              className="group relative block overflow-hidden border-[1.5px] border-ink"
            >
              <img
                src={story?.hero ?? featured.image ?? undefined}
                alt=""
                className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:aspect-[4/3] md:aspect-[21/9]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(8_4_4/.8)_0%,rgb(8_4_4/.25)_55%,transparent_80%),linear-gradient(0deg,rgb(8_4_4/.6),transparent_50%)]" />
              <div className="absolute inset-0 grid grid-cols-[minmax(0,1fr)_auto] content-between gap-4 p-4 sm:p-6">
                <span className="label self-start justify-self-start bg-house px-2 py-1 font-bold tracking-[0.06em] text-white">
                  Cover story
                </span>
                {featured.metascore !== null ? (
                  <ScoreStamp value={featured.metascore} className="rotate-5 border-white text-white" />
                ) : (
                  <span />
                )}
                <div className="col-span-2 grid max-w-xl gap-2">
                  <h2 className="narrow text-[clamp(34px,5.5vw,68px)] leading-[0.9] font-extrabold tracking-[-0.015em] text-white uppercase">
                    {featured.name}
                  </h2>
                  {tagline && <p className="max-w-[46ch] font-body text-base text-white/85">{tagline}</p>}
                </div>
              </div>
            </Link>
          ) : (
            <div className="aspect-[3/4] animate-pulse bg-tint sm:aspect-[4/3] md:aspect-[21/9]" />
          )}
        </div>

        <nav className="grid border-y-[1.5px] border-ink md:grid-cols-3">
          {teasers.map((teaser) => (
            <Link
              key={teaser.title}
              to={teaser.to}
              className="group grid gap-1 px-4 pt-3 pb-3.5 max-md:not-first:border-t-[1.5px] md:not-first:border-l-[1.5px]"
            >
              <b className="narrow text-[21px] leading-[1.05] font-extrabold uppercase group-hover:text-house">
                {teaser.title} →
              </b>
              <span className="font-body text-[13.5px] text-faded">{teaser.text}</span>
            </Link>
          ))}
        </nav>
      </header>

      <Rail title="Trending now" games={trending.data?.results.slice(1)} more="/games?sort=added" />
      <Rail title="New and notable" games={fresh.data?.results} />
      <Rail title="All-time greats" games={greats.data?.results} more="/games?sort=metascore" />
    </div>
  );
};

export default HomePage;
