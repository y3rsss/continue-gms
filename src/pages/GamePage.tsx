import { useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router";
import { fullDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ApiError } from "../services/api";
import BacklogStamps from "../components/BacklogStamps";
import Cover from "../components/Cover";
import GameOver from "../components/GameOver";
import Meta from "../components/Meta";
import Score from "../components/Score";
import ScoreStamp from "../components/ScoreStamp";
import StoreLinks from "../components/StoreLinks";
import useGame from "../hooks/useGame";
import useSpot from "../hooks/useSpot";
import useStores from "../hooks/useStores";

const GamePage = () => {
  const { slug } = useParams();
  const { data: game, error, isPending } = useGame(slug);
  const stores = useStores(slug).data;
  const spot = useSpot(game?.image).data;
  const [expanded, setExpanded] = useState(false);

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <GameOver message="We couldn't find that game. It may have been renamed or removed." />
    ) : (
      <GameOver message={`${error.message}. Try again in a moment.`} />
    );
  }

  if (isPending) {
    return (
      <div className="grid gap-8 px-4 py-7 sm:px-7 lg:grid-cols-[1.25fr_1fr]">
        <div className="aspect-[3/2] animate-pulse bg-tint" />
        <div className="grid content-start gap-4">
          <div className="h-4 w-32 animate-pulse bg-tint" />
          <div className="h-16 w-3/4 animate-pulse bg-tint" />
          <div className="h-10 w-full animate-pulse bg-tint" />
          <div className="h-32 w-full animate-pulse bg-tint" />
        </div>
      </div>
    );
  }

  const paragraphs = game.description.split(/\n+/).filter(Boolean);
  const specs = [
    ["Developer", game.developers.join(", ")],
    ["Publisher", game.publishers.join(", ")],
    ["Released", fullDate(game.released)],
    ["Platforms", game.platforms.map((p) => p.name).join(", ")],
  ].filter(([, value]) => value);

  return (
    <article
      style={{ "--spot": spot ?? "var(--house)" } as CSSProperties}
      className="spot-scope [transition:--spot_.5s_ease]"
    >
      <title>{`${game.name} | Continue?`}</title>
      <section className="grid gap-8 border-b-[3px] border-ink bg-[radial-gradient(80%_120%_at_0%_0%,color-mix(in_oklab,var(--spot)_22%,transparent),transparent_65%)] px-4 py-7 sm:px-7 lg:grid-cols-[1.25fr_1fr]">
        <Cover
          src={game.hero}
          alt={game.name}
          eager
          className="border-2 shadow-[10px_10px_0_color-mix(in_oklab,var(--spot)_70%,transparent)]"
        />
        <div className="grid min-w-0 content-start gap-4">
          {game.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {game.genres.map((genre) => (
                <Link
                  key={genre.slug}
                  to={`/games?genre=${genre.slug}`}
                  className="label border-[1.5px] border-spot px-2 py-0.5 font-bold text-spot-text hover:bg-spot hover:text-white"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <h1 className="narrow text-[clamp(40px,5.5vw,72px)] leading-[0.88] font-extrabold tracking-[-0.015em] uppercase">
              {game.name}
            </h1>
            {game.metascore !== null && (
              <ScoreStamp value={game.metascore} className="-rotate-5 border-spot text-spot-text" />
            )}
          </div>
          <BacklogStamps game={game} />
          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] font-mono text-xs">
            {specs.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="label border-t-[1.5px] border-ink py-1.5 pr-5 text-[10.5px] text-faded">
                  {label}
                </dt>
                <dd className="border-t-[1.5px] border-ink py-1.5">{value}</dd>
              </div>
            ))}
            {game.website && (
              <div className="contents">
                <dt className="label border-t-[1.5px] border-ink py-1.5 pr-5 text-[10.5px] text-faded">
                  Website
                </dt>
                <dd className="truncate border-t-[1.5px] border-ink py-1.5">
                  <a
                    href={game.website}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-spot-text"
                  >
                    {new URL(game.website).hostname.replace(/^www\./, "")}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <StoreLinks stores={stores} />
        </div>
      </section>

      <section className="grid gap-8 px-4 pt-6 pb-12 sm:px-7 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid min-w-0 content-start gap-5">
          {paragraphs.length > 0 && (
            <div className="grid justify-items-start gap-2">
              <div
                className={cn(
                  "grid max-w-[62ch] gap-3 font-body text-base leading-relaxed",
                  !expanded && "line-clamp-[8]",
                )}
              >
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className={cn(
                      i === 0 &&
                        "first-letter:wide first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-sans first-letter:text-[3.1em] first-letter:leading-[0.82] first-letter:font-black first-letter:text-spot-text",
                    )}
                  >
                    {p}
                  </p>
                ))}
              </div>
              {paragraphs.join(" ").length > 600 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="label text-spot-text hover:underline"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
          {game.screenshots.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {game.screenshots.slice(0, 6).map((shot) => (
                <a key={shot} href={shot} target="_blank" rel="noreferrer">
                  <Cover
                    src={shot}
                    alt={`${game.name} screenshot`}
                    className="aspect-video hover:border-spot"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {game.similar.length > 0 && (
          <aside className="grid content-start gap-3">
            <div className="flex items-baseline justify-between border-t-[3px] border-spot pt-2">
              <h2 className="wide text-lg font-black tracking-[-0.02em] uppercase">
                If you like {game.name}
              </h2>
            </div>
            <div className="grid">
              {game.similar.map((other) => (
                <Link
                  key={other.id}
                  to={`/games/${other.slug}`}
                  className="group grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 border-t-[1.5px] border-ink py-2"
                >
                  <Cover src={other.image} alt="" />
                  <span className="min-w-0">
                    <b className="narrow block text-[17px] leading-[1.05] font-extrabold uppercase group-hover:text-spot-text">
                      {other.name}
                    </b>
                    <Meta
                      items={[other.released?.slice(0, 4), other.genres[0]?.name]}
                      className="mt-1 text-[10px]"
                    />
                  </span>
                  <Score value={other.metascore} />
                </Link>
              ))}
            </div>
          </aside>
        )}
      </section>
    </article>
  );
};

export default GamePage;
