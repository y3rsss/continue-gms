import { Dialog } from "radix-ui";
import { ArrowLeft, X } from "lucide-react";
import { closeAuth, openAuth, useAuthDialog } from "../../hooks/useAuthDialog";
import ForgotView from "./ForgotView";
import ModeMenu from "./ModeMenu";
import SentView from "./SentView";
import SignInView from "./SignInView";
import SignUpView from "./SignUpView";

const AuthDialog = () => {
  const { view } = useAuthDialog();
  const tabbed = view === "signin" || view === "signup";

  return (
    <Dialog.Root open={view !== null} onOpenChange={(open) => !open && closeAuth()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#15171c]/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 overflow-y-auto bg-paper text-ink data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100svh-2rem)] sm:w-[min(560px,calc(100vw-2rem))] sm:-translate-1/2 sm:border-[3px] sm:border-ink sm:shadow-[8px_8px_0_var(--ink)] sm:data-[state=open]:zoom-in-95"
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute top-4 right-1.75 grid size-11 place-items-center hover:bg-tint sm:top-8.75 sm:right-4.75"
          >
            <X className="size-4.5" strokeWidth={2.5} />
          </Dialog.Close>
          <div className="grid content-start gap-4.5 p-5 sm:p-8">
            {tabbed ? (
              <ModeMenu view={view} />
            ) : (
              <button
                type="button"
                onClick={() => openAuth("signin")}
                className="label -mt-1 -ml-3 flex h-11 items-center gap-2 justify-self-start px-3 font-bold hover:bg-tint sm:mt-0.75"
              >
                <ArrowLeft className="size-4" strokeWidth={2.5} />
                Back to sign in
              </button>
            )}
            {view === "signin" && <SignInView />}
            {view === "signup" && <SignUpView />}
            {view === "forgot" && <ForgotView />}
            {view === "sent-signup" && <SentView key="signup" kind="signup" />}
            {view === "sent-reset" && <SentView key="reset" kind="reset" />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AuthDialog;
