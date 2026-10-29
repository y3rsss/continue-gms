import type { ReactNode } from "react";

const CONTACT = "casualfromkz@gmail.com";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="grid gap-3 border-t-[1.5px] border-ink pt-4">
    <h2 className="wide text-2xl leading-none font-black tracking-[-0.03em] uppercase">{title}</h2>
    <div className="grid max-w-[64ch] gap-3 font-body text-lg leading-relaxed">{children}</div>
  </section>
);

const PrivacyPage = () => (
  <div className="grid content-start gap-7 px-4 pt-6 pb-12 sm:px-7">
    <title>Privacy | Continue?</title>
    <header className="grid gap-2 border-b-[6px] border-ink pb-2.5">
      <h1 className="wide text-[clamp(32px,5.5vw,62px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
        Privacy
      </h1>
      <p className="label text-faded">Last updated October 28, 2026</p>
    </header>
    <p className="max-w-[64ch] font-body text-lg leading-relaxed">
      Continue? is a free hobby project. You can browse without an account. If you make one, here is what we
      keep and why. No ads, no analytics, and nothing is ever sold.
    </p>
    <Section title="What we keep">
      <p>
        <strong>Your account.</strong> Your email and password. The password is stored hashed by Supabase, so
        nobody can read it, us included. If you sign in with Google or GitHub, we get your name, email and
        profile picture from them.
      </p>
      <p>
        <strong>Your profile.</strong> A username, display name, profile picture link and whether your profile
        is public.
      </p>
      <p>
        <strong>Your backlog.</strong> The games you save while signed in and their status, so they sync
        between your devices.
      </p>
    </Section>
    <Section title="In your browser">
      <p>
        Your browser stores your sign-in session, your backlog (a copy of it while you are signed in, removed
        when you sign out), recently viewed games and whether you read the day or night edition. None of it is
        used for tracking.
      </p>
    </Section>
    <Section title="Who else handles it">
      <ul className="grid list-disc gap-2 pl-5">
        <li>
          Supabase stores accounts and backlogs and runs sign-in. It keeps sign-in logs, like IP addresses,
          for security.
        </li>
        <li>Vercel hosts the site and keeps short request logs.</li>
        <li>Google or GitHub, only if you sign in with them.</li>
        <li>Gmail sends the confirmation and password reset emails.</li>
        <li>Game images load from RAWG, so their servers see your IP address like any website would.</li>
      </ul>
    </Section>
    <Section title="Who sees your profile">
      <p>
        Your profile is private when you sign up. If you make it public, anyone with the link can see your
        username, display name, picture and backlog. Your email is never shown.
      </p>
    </Section>
    <Section title="Deleting your account">
      <p>
        Go to Account settings and choose Delete account. Your account, profile and backlog are removed right
        away. If you can't sign in anymore, email{" "}
        <a href={`mailto:${CONTACT}`} className="font-bold underline underline-offset-4">
          {CONTACT}
        </a>{" "}
        from the address you signed up with and we will do it for you.
      </p>
    </Section>
  </div>
);

export default PrivacyPage;
