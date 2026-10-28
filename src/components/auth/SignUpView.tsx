import { useState, type SubmitEvent } from "react";
import { authMessage } from "@/lib/auth-errors";
import { PASSWORD_HINT, strongEnough } from "@/lib/password";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { closeAuth, openAuth, setAuthEmail, useAuthDialog } from "../../hooks/useAuthDialog";
import { usernameFromEmail } from "@/lib/username";
import { Field, FormError, PasswordField, SubmitButton } from "./fields";
import OAuthButtons from "./OAuthButtons";

const SignUpView = () => {
  const { email } = useAuthDialog();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!strongEnough(password)) return setError(PASSWORD_HINT);
    setPending(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setPending(false);
    if (error) return setError(authMessage(error));
    if (data.session) {
      closeAuth();
      toast("Account created. You're signed in.");
      return;
    }
    openAuth("sent-signup");
  };

  return (
    <>
      <OAuthButtons verb="Sign up" />
      {error && <FormError>{error}</FormError>}
      <form onSubmit={(event) => void submit(event)} className="grid gap-3.5">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setAuthEmail(event.target.value)}
          aside={
            email.includes("@") && (
              <span className="label text-faded normal-case">
                You'll be <b className="text-ink">@{usernameFromEmail(email)}</b>
              </span>
            )
          }
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          required
          rules
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <SubmitButton pending={pending} filled>
          Create account
        </SubmitButton>
      </form>
    </>
  );
};

export default SignUpView;
