import { Link } from "react-router";
import { Bookmark, ChevronDown, LogOut, Settings2, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authMessage } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { useBacklog } from "../hooks/useBacklog";
import { useProfile } from "../hooks/useProfile";
import Avatar from "./Avatar";

const ITEM = "label h-11 gap-3 rounded-none px-3.5 focus:bg-tint [&_svg:not([class*='size-'])]:size-4";
const RULE = "m-0 h-[1.5px] bg-ink";

const signOut = async () => {
  // local: only this browser, other devices stay signed in
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) toast(authMessage(error), "alert");
  else toast("Signed out.");
};

const AccountMenu = () => {
  const { data: profile } = useProfile();
  const games = Object.keys(useBacklog()).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="group flex shrink-0 items-center gap-1.5 border-[1.5px] border-ink bg-tint p-[3px] pr-2 data-[state=open]:bg-ink data-[state=open]:text-paper"
      >
        <Avatar profile={profile} className="size-7 text-[15px]" />
        <ChevronDown
          className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
          strokeWidth={2.5}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 border-[3px] border-ink p-0 shadow-[6px_6px_0_var(--ink)] ring-0"
      >
        <div className="flex items-center gap-3 p-3.5">
          <Avatar profile={profile} className="size-11 shrink-0 text-[22px]" />
          <div className="grid min-w-0 gap-1">
            <span className="narrow truncate text-xl leading-none font-extrabold uppercase">
              {profile?.display_name}
            </span>
            <span className="truncate font-mono text-[11px] text-faded">@{profile?.username}</span>
          </div>
          {profile && (
            <span className="label ml-auto shrink-0 -rotate-4 self-start border-[1.5px] border-faded px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.08em] text-faded">
              {profile.is_public ? "Public" : "Private"}
            </span>
          )}
        </div>
        <DropdownMenuSeparator className={RULE} />
        {profile && (
          <DropdownMenuItem asChild className={ITEM}>
            <Link to={`/u/${profile.username}`}>
              <User />
              My profile
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className={ITEM}>
          <Link to="/backlog">
            <Bookmark />
            My backlog
            <span className="ml-auto text-faded">{games}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM}>
          <Link to="/settings">
            <Settings2 />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className={RULE} />
        <DropdownMenuItem className={ITEM} onSelect={() => void signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
