import { useState, type SubmitEvent } from "react";
import { authMessage } from "@/lib/auth-errors";
import { PASSWORD_HINT, strongEnough } from "@/lib/password";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { FormError, PasswordField, SubmitButton } from "../auth/fields";

const PasswordForm = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!strongEnough(password)) return setError(PASSWORD_HINT);
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) return setError(authMessage(error));
    setPassword("");
    toast("Password saved.");
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-3.5">
      {error && <FormError>{error}</FormError>}
      <PasswordField
        label="New password"
        autoComplete="new-password"
        required
        rules
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <SubmitButton pending={pending} filled className="justify-self-start px-6">
        Save password
      </SubmitButton>
    </form>
  );
};

export default PasswordForm;
