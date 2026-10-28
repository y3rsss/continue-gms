import { useState, type SubmitEvent } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { cleanUsername } from "@/lib/username";
import { useUpdateProfile, type Profile } from "../../hooks/useProfile";
import { useUsernameStatus } from "../../hooks/useUsernameStatus";
import { Field, FormError, SubmitButton } from "../auth/fields";

const RULE = "Usernames are 3 to 24 letters, numbers or _.";

const UsernameNote = ({ status }: { status: ReturnType<typeof useUsernameStatus> }) => {
  if (status === "same") return null;
  if (status === "invalid") return <span className="label text-faded normal-case">3 to 24 characters</span>;
  if (status === "checking")
    return <LoaderCircle aria-label="Checking" className="size-3.5 animate-spin text-faded" />;
  if (status === "taken") return <span className="label font-bold text-alert">Taken</span>;
  return (
    <span className="label flex items-center gap-1 font-bold text-ok">
      <Check className="size-3.5" strokeWidth={3} />
      Available
    </span>
  );
};

const message = (error: PostgrestError) => {
  if (error.code === "23505") return "That username is taken.";
  if (error.code === "23514") return RULE;
  return "Couldn't save your profile. Try again.";
};

const ProfileForm = ({ profile }: { profile: Profile }) => {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [error, setError] = useState<string | null>(null);
  const status = useUsernameStatus(username, profile.username);
  const update = useUpdateProfile();

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) return setError("Add a display name.");
    if (status === "invalid") return setError(RULE);
    if (status === "taken") return setError("That username is taken.");
    setError(null);
    try {
      await update.mutateAsync({ display_name: name, username });
      toast("Profile saved.");
    } catch (error) {
      setError(message(error as PostgrestError));
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-3.5">
      {error && <FormError>{error}</FormError>}
      <Field
        label="Display name"
        autoComplete="nickname"
        required
        maxLength={50}
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
      />
      <Field
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        maxLength={24}
        value={username}
        onChange={(event) => setUsername(cleanUsername(event.target.value))}
        aside={<UsernameNote status={status} />}
      />
      <SubmitButton pending={update.isPending} filled className="justify-self-start px-6">
        Save profile
      </SubmitButton>
    </form>
  );
};

export default ProfileForm;
