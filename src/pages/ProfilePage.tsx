import { Link, useParams } from "react-router";
import Avatar from "../components/Avatar";
import BacklogView, { BrowseLink } from "../components/BacklogView";
import { GameCardSkeleton } from "../components/GameCard";
import { useBacklog, useBacklogReady } from "../hooks/useBacklog";
import { usePublicProfile } from "../hooks/usePublicProfile";
import { useUser } from "../hooks/useSession";

const TITLE =
  "wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] wrap-break-word uppercase";

const ProfilePage = () => {
  const username = (useParams().username ?? "").toLowerCase();
  const { data, isPending, isError } = usePublicProfile(username);
  const userId = useUser()?.id;
  const backlog = useBacklog();
  const ready = useBacklogReady();
  const own = !!data && data.profile.id === userId;
  // your own page follows your stamps live
  const entries = own
    ? Object.values(backlog).sort((a, b) => b.updatedAt - a.updatedAt)
    : (data?.entries ?? []);

  return (
    <div className="grid content-start gap-5 px-4 pt-6 pb-12 sm:px-7">
      <title>{`@${username} | Continue?`}</title>

      {isPending && (
        <div aria-hidden className="grid gap-5">
          <div className="flex items-end gap-4 border-b-[6px] border-ink pb-2.5">
            <div className="size-14 animate-pulse bg-tint sm:size-18" />
            <div className="h-12 w-64 animate-pulse bg-tint" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* a failed background refetch keeps the old data, show that instead */}
      {((isError && !data) || data === null) && (
        <>
          <header className="border-b-[6px] border-ink pb-2.5">
            <h1 className={TITLE}>@{username}</h1>
          </header>
          <div className="grid justify-items-start gap-3 py-4">
            <p className="max-w-[52ch] font-body text-lg">
              {isError
                ? "Couldn't load this profile. Check your connection and try again."
                : "There's no public profile here. The username may be wrong, or the profile is private."}
            </p>
            <BrowseLink />
          </div>
        </>
      )}

      {data && (
        <>
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-[6px] border-ink pb-2.5">
            <div className="flex min-w-0 items-end gap-4">
              <Avatar
                profile={data.profile}
                className="size-14 shrink-0 text-[30px] sm:size-18 sm:text-[38px]"
              />
              <div className="grid min-w-0 gap-2">
                <span className="label text-faded normal-case">@{data.profile.username}</span>
                <h1 className={TITLE}>{data.profile.display_name}</h1>
              </div>
            </div>
            {entries.length > 0 && (
              <span className="label text-faded">
                {entries.length} {entries.length === 1 ? "game" : "games"}
              </span>
            )}
          </header>

          {own && !data.profile.is_public && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-tint px-3.5 py-3 font-body text-[15px]">
              Only you can see this page.
              <Link to="/settings" className="label font-bold underline underline-offset-3 hover:text-faded">
                Make it public
              </Link>
            </p>
          )}

          <BacklogView
            entries={entries}
            loading={own && !ready}
            empty={
              own ? (
                <>
                  <p className="max-w-[52ch] font-body text-lg">
                    Nothing here yet. Games you stamp show up here.
                  </p>
                  <BrowseLink />
                </>
              ) : (
                <p className="max-w-[52ch] font-body text-lg">
                  @{data.profile.username} hasn't saved any games yet.
                </p>
              )
            }
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;
