import { lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { openAuth } from "../hooks/useAuthDialog";
import { prefetchAuthProviders } from "../hooks/useAuthProviders";
import { useSession } from "../hooks/useSession";

const AccountMenu = lazy(() => import("./AccountMenu"));

const Account = () => {
  const session = useSession();
  const queryClient = useQueryClient();

  if (session) {
    return (
      <Suspense fallback={<span className="block h-9.5 w-15 shrink-0 border-[1.5px] border-ink bg-tint" />}>
        <AccountMenu />
      </Suspense>
    );
  }

  const prefetch = () => void prefetchAuthProviders(queryClient);

  return (
    <button
      type="button"
      onClick={() => openAuth()}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      // keeps its place while the stored session loads, so the bar doesn't jump
      className={cn(
        "label inline-flex shrink-0 items-center gap-2 border-[1.5px] border-ink bg-ink px-3 py-2 font-bold whitespace-nowrap text-paper hover:bg-ink/85",
        session === undefined && "invisible",
      )}
    >
      <User className="size-3.5" strokeWidth={2.25} />
      Sign in
    </button>
  );
};

export default Account;
