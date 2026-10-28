import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Profile } from "../hooks/useProfile";

const Avatar = ({ profile, className }: { profile?: Profile; className?: string }) => {
  const [broken, setBroken] = useState(false);

  if (profile?.avatar_url && !broken) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "wide grid place-items-center font-black text-white",
        profile ? "bg-house" : "bg-tint",
        className,
      )}
    >
      {profile?.display_name[0]?.toUpperCase()}
    </span>
  );
};

export default Avatar;
