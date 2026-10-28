import type { ReactNode } from "react";
import DeleteAccount from "../components/settings/DeleteAccount";
import PasswordForm from "../components/settings/PasswordForm";
import ProfileForm from "../components/settings/ProfileForm";
import VisibilityForm from "../components/settings/VisibilityForm";
import { openAuth } from "../hooks/useAuthDialog";
import { useProfile } from "../hooks/useProfile";
import { useSession } from "../hooks/useSession";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="grid gap-4 border-t-[1.5px] border-ink pt-4 lg:grid-cols-[240px_minmax(0,520px)] lg:gap-10">
    <h2 className="wide text-2xl leading-none font-black tracking-[-0.03em] uppercase">{title}</h2>
    <div className="grid gap-4">{children}</div>
  </section>
);

const SettingsPage = () => {
  const session = useSession();
  const { data: profile } = useProfile();

  return (
    <div className="grid content-start gap-7 px-4 pt-6 pb-12 sm:px-7">
      <title>Account settings | Continue?</title>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-[6px] border-ink pb-2.5">
        <h1 className="wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
          Account settings
        </h1>
        {session && <span className="label break-all text-faded normal-case">{session.user.email}</span>}
      </header>

      {session && !profile && (
        <div aria-hidden className="grid gap-4">
          <div className="h-40 animate-pulse bg-tint" />
          <div className="h-24 animate-pulse bg-tint" />
        </div>
      )}

      {session && profile && (
        <>
          <Section title="Profile">
            <ProfileForm profile={profile} />
          </Section>
          <Section title="Shelf">
            <VisibilityForm profile={profile} />
          </Section>
          <Section title="Password">
            <PasswordForm />
          </Section>
          <Section title="Account">
            <p className="font-body text-lg leading-snug">
              Deleting removes your profile and backlog for good.
            </p>
            <DeleteAccount username={profile.username} />
          </Section>
        </>
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
