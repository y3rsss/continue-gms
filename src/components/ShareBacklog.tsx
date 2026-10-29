import { Popover } from "radix-ui";
import { Globe, Lock } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import VisibilityForm from "./settings/VisibilityForm";

const ShareBacklog = () => {
  const { data: profile } = useProfile();
  if (!profile) return null;

  return (
    <Popover.Root>
      <Popover.Trigger className="label inline-flex h-9 items-center gap-1.5 border-2 border-ink px-3 font-bold hover:bg-ink hover:text-paper data-[state=open]:bg-ink data-[state=open]:text-paper">
        {profile.is_public ? (
          <Globe className="size-3.5" strokeWidth={2.5} />
        ) : (
          <Lock className="size-3.5" strokeWidth={2.5} />
        )}
        Share
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[min(340px,calc(100vw-2rem))] border-[3px] border-ink bg-paper p-3.5 text-ink shadow-[6px_6px_0_var(--ink)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <VisibilityForm profile={profile} className="sm:grid-cols-1" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default ShareBacklog;
