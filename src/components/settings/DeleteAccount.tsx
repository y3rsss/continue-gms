import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { Dialog } from "radix-ui";
import { LoaderCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { Field, FormError } from "../auth/fields";

const DeleteAccount = ({ username }: { username: string }) => {
  const navigate = useNavigate();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const remove = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.rpc("delete_account");
    if (error) {
      setPending(false);
      return setError("Couldn't delete your account. Try again.");
    }
    await supabase.auth.signOut({ scope: "local" });
    toast("Account deleted.");
    void navigate("/");
  };

  return (
    <Dialog.Root
      onOpenChange={() => {
        setTyped("");
        setError(null);
      }}
    >
      <Dialog.Trigger className="label h-13 justify-self-start border-2 border-alert px-6 font-bold text-alert hover:bg-alert hover:text-paper">
        Delete account
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#15171c]/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 grid w-[min(480px,calc(100vw-2rem))] -translate-1/2 gap-4.5 border-[3px] border-ink bg-paper p-5 text-ink shadow-[8px_8px_0_var(--ink)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-8"
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute top-3 right-1.75 grid size-11 place-items-center hover:bg-tint sm:top-7 sm:right-4.75"
          >
            <X className="size-4.5" strokeWidth={2.5} />
          </Dialog.Close>
          <Dialog.Title className="wide pr-10 text-[clamp(32px,8vw,40px)] leading-[0.9] font-black tracking-[-0.04em] uppercase">
            Delete your account?
          </Dialog.Title>
          <p className="font-body text-lg leading-snug">
            Your profile and backlog go with it. This can't be undone.
          </p>
          {error && <FormError>{error}</FormError>}
          <form onSubmit={(event) => void remove(event)} className="grid gap-3.5">
            <Field
              label="Type your username to confirm"
              placeholder={username}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
            <button
              type="submit"
              disabled={typed !== username || pending}
              className="label flex h-13 items-center justify-center gap-2 border-2 border-alert bg-alert font-bold text-paper hover:bg-alert/85 disabled:opacity-40"
            >
              Delete my account
              {pending && <LoaderCircle className="size-4 animate-spin" />}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DeleteAccount;
