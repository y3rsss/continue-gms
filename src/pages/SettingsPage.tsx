import { openAuth } from "../hooks/useAuthDialog";
import { useSession } from "../hooks/useSession";

const SettingsPage = () => {
  const session = useSession();

  return (
    <div className="grid content-start gap-5 px-4 pt-6 pb-12 sm:px-7">
      <title>Account settings | Continue?</title>
      <header className="border-b-[6px] border-ink pb-2.5">
        <h1 className="wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
          Account settings
        </h1>
      </header>
      {session && (
        <p className="max-w-[52ch] py-4 font-body text-lg">
          Signed in as <strong className="break-all">{session.user.email}</strong>. Changing your username,
          password and who can see your shelf is coming soon.
        </p>
      )}
      {session === null && (
        <div className="grid justify-items-start gap-3 py-4">
          <p className="font-body text-lg">Sign in to manage your account.</p>
          <button
            type="button"
            onClick={() => openAuth()}
            className="label border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
