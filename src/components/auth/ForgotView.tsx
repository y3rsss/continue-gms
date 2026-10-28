import { useState, type SubmitEvent } from "react";
import { sendPasswordReset } from "@/lib/auth";
import { authMessage } from "@/lib/auth-errors";
import { openAuth, setAuthEmail, useAuthDialog } from "../../hooks/useAuthDialog";
import { Field, FormError, Lede, SubmitButton, Title } from "./fields";

const ForgotView = () => {
  const { email } = useAuthDialog();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await sendPasswordReset(email);
    setPending(false);
    if (error) return setError(authMessage(error));
    openAuth("sent-reset");
  };

  return (
    <>
      <div>
        <Title>Forgot password</Title>
        <Lede>Enter your email and we'll send a link to set a new one.</Lede>
      </div>
      {error && <FormError>{error}</FormError>}
      <form onSubmit={(event) => void submit(event)} className="grid gap-3.5">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setAuthEmail(event.target.value)}
        />
        <SubmitButton pending={pending} filled>
          Send reset link
        </SubmitButton>
      </form>
      <p className="font-body text-sm text-faded">
        Signed up with Google or GitHub? You don't have a password here, use those buttons instead.
      </p>
    </>
  );
};

export default ForgotView;
