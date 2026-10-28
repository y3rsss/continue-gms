import { Link, useParams } from "react-router";
import { ArrowRight } from "lucide-react";

const ProfilePage = () => {
  const { username } = useParams();

  return (
    <div className="grid content-start gap-5 px-4 pt-6 pb-12 sm:px-7">
      <title>{`@${username} | Continue?`}</title>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-[6px] border-ink pb-2.5">
        <h1 className="wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] break-all uppercase">
          @{username}
        </h1>
        <span className="label text-faded">Shelf</span>
      </header>
      <div className="grid justify-items-start gap-3 py-4">
        <p className="max-w-[52ch] font-body text-lg">
          Shelves are on the way. Soon this page shows what @{username} is playing, has finished and wants to
          play next.
        </p>
        <Link
          to="/games"
          className="label inline-flex items-center gap-1.5 border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper"
        >
          Browse the index
          <ArrowRight className="size-3.5" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;
