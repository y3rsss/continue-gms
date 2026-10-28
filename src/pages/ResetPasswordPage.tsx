import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { authMessage } from "@/lib/auth-errors";
import { authRedirect } from "@/lib/auth-redirect";
import { PASSWORD_HINT, strongEnough } from "@/lib/password";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { FormError, PasswordField, SubmitButton } from "../components/auth/fields";
import { openAuth } from "../hooks/useAuthDialog";
import { useSession } from "../hooks/useSession";

const ResetPasswordPage = () => {
  const session = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!strongEnough(password)) return setError(PASSWORD_HINT);
    if (password !== repeat) return setError("The two passwords don't match.");
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) return setError(authMessage(error));
    toast("Password saved.");
    void navigate("/");
  };

  return (
    <div className="mx-auto grid w-full max-w-[520px] content-start gap-6 px-4 pt-16 pb-20">
      <title>New password | Continue?</title>
      <h1 className="wide border-b-[6px] border-ink pb-4 text-[clamp(40px,7vw,64px)] leading-[0.85] font-black tracking-[-0.04em] uppercase">
        New password
      </h1>

      {session && (
        <>
          <p className="font-body text-lg">
            Signed in as <strong className="break-all">{session.user.email}</strong>. Pick a new password and
            you're done.
          </p>
          {error && <FormError>{error}</FormError>}
          <form onSubmit={(event) => void submit(event)} className="grid gap-4">
            <PasswordField
              label="New password"
              autoComplete="new-password"
              required
              rules
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordField
              label="Repeat it"
              autoComplete="new-password"
              required
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
            <SubmitButton pending={pending} filled>
              Save password
            </SubmitButton>
          </form>
        </>
      )}

      {session === null && (
        <div className="grid justify-items-start gap-4">
          <p className="font-body text-lg">
            {authRedirect.error
              ? "This reset link expired or was already used."
              : "Open this page from the link in your password reset email."}
          </p>
          <button
            type="button"
            onClick={() => openAuth("forgot")}
            className="label border-2 border-ink px-3 py-2 font-bold hover:bg-ink hover:text-paper"
          >
            Send a new link
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;
