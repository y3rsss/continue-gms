import { useState, type SubmitEvent } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { sendConfirmation } from "@/lib/auth";
import { authMessage } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { closeAuth, openAuth, setAuthEmail, useAuthDialog } from "../../hooks/useAuthDialog";
import { Field, FormError, PasswordField, SubmitButton, TextButton } from "./fields";
import OAuthButtons from "./OAuthButtons";

const SignInView = () => {
  const { email } = useAuthDialog();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) return setError(error);
    closeAuth();
    toast("Signed in. Welcome back.");
  };

  const resend = async () => {
    const { error } = await sendConfirmation(email);
    if (error) return setError(error);
    openAuth("sent-signup");
  };

  return (
    <>
      <OAuthButtons verb="Continue" />
      {error && (
        <FormError>
          {authMessage(error)}{" "}
          {error.code === "email_not_confirmed" && (
            <TextButton onClick={() => void resend()} className="font-bold text-alert">
              Send it again
            </TextButton>
          )}
        </FormError>
      )}
      <form onSubmit={(event) => void submit(event)} className="grid gap-3.5">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setAuthEmail(event.target.value)}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aside={<TextButton onClick={() => openAuth("forgot")}>Forgot it?</TextButton>}
        />
        <SubmitButton pending={pending} filled>
          Sign in
        </SubmitButton>
      </form>
    </>
  );
};

export default SignInView;
