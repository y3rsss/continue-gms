import BacklogView, { BrowseLink } from "../components/BacklogView";
import { useBacklog, useBacklogReady } from "../hooks/useBacklog";

const BacklogPage = () => {
  const backlog = useBacklog();
  const ready = useBacklogReady();
  const entries = Object.values(backlog).sort((a, b) => b.updatedAt - a.updatedAt);

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

      <BacklogView
        entries={entries}
        loading={!ready}
        empty={
          <>
            <p className="max-w-[52ch] font-body text-lg">
              Nothing here yet. Open any game and stamp it: Want to play, Playing, Finished or Dropped.
            </p>
            <BrowseLink />
          </>
        }
      />
    </div>
  );
};

export default BacklogPage;
