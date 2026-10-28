import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { sendConfirmation, sendPasswordReset } from "@/lib/auth";
import { authMessage } from "@/lib/auth-errors";
import { openAuth, useAuthDialog } from "../../hooks/useAuthDialog";
import { FormError, TextButton, Title } from "./fields";

// supabase refuses to email the same address again within a minute
const COOLDOWN = 60;

const SentView = ({ kind }: { kind: "signup" | "reset" }) => {
  const { email } = useAuthDialog();
  const [left, setLeft] = useState(COOLDOWN);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const resend = async () => {
    setError(null);
    setLeft(COOLDOWN);
    const { error } = kind === "signup" ? await sendConfirmation(email) : await sendPasswordReset(email);
    if (error) setError(authMessage(error));
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <Title>Check your inbox</Title>
        <span className="label mt-1.5 inline-flex shrink-0 rotate-6 items-center gap-1.5 border-2 border-alert px-2 py-1.5 font-bold tracking-[0.08em] text-alert">
          <Mail className="size-3.5" strokeWidth={2.5} />
          Sent
        </span>
      </div>
      <p className="font-body text-lg leading-snug">
        {kind === "signup" ? (
          <>
            We sent a confirmation link to <strong className="break-all">{email}</strong>. Open it on any
            device to finish signing up.
          </>
        ) : (
          <>
            If <strong className="break-all">{email}</strong> has an account, a link to set a new password is
            on its way.
          </>
        )}
      </p>
      <div className="grid gap-1 bg-tint px-3.5 py-3">
        <span className="label font-bold">It comes from our Gmail address</span>
        <span className="font-body text-[15px] text-faded">
          Not there after a minute? Check Spam or Promotions.
        </span>
      </div>
      {error && <FormError>{error}</FormError>}
      <button
        type="button"
        disabled={left > 0}
        onClick={() => void resend()}
        className="label flex h-13 items-center justify-center border-2 border-ink font-bold hover:bg-ink hover:text-paper disabled:border-dashed disabled:border-faded disabled:text-faded disabled:hover:bg-transparent"
      >
        {left > 0
          ? `Resend in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`
          : "Send it again"}
      </button>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <TextButton onClick={() => openAuth(kind === "signup" ? "signup" : "forgot")}>
          Use a different email
        </TextButton>
        {kind === "signup" && (
          <TextButton onClick={() => openAuth("signin")}>I already have an account</TextButton>
        )}
      </div>
    </>
  );
};

export default SentView;
