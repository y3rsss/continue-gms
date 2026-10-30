import { Link } from "react-router";
import { Copy } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useUpdateProfile, type Profile } from "../../hooks/useProfile";

const OPTIONS = [
  { value: false, title: "Private", hint: "Only you can see your profile and backlog." },
  { value: true, title: "Public", hint: "Anyone with the link can see them." },
];

const VisibilityForm = ({ profile, className }: { profile: Profile; className?: string }) => {
  const update = useUpdateProfile();
  const shown = update.isPending ? update.variables.is_public : profile.is_public;
  const path = `/u/${profile.username}`;

  const change = (is_public: boolean) =>
    update.mutate(
      { is_public },
      {
        onSuccess: () => toast(is_public ? "Your profile is public." : "Your profile is private."),
        onError: () => toast("Couldn't change who sees your profile. Try again.", "alert"),
      },
    );

  // clipboard is undefined on plain http (like the dev server opened from a phone), so it throws instead of rejecting
  const copy = () =>
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(window.location.origin + path))
      .then(
        () => toast("Link copied."),
        () => toast("Couldn't copy the link. Copy it from the address bar instead.", "alert"),
      );

  return (
    <div className="grid grid-cols-1 gap-3">
      <fieldset className={cn("grid gap-2 sm:grid-cols-2", className)}>
        <legend className="sr-only">Who can see your profile</legend>
        {OPTIONS.map((option) => {
          const on = shown === option.value;
          return (
            <label
              key={option.title}
              className={cn(
                "grid cursor-pointer gap-1 border-[1.5px] border-ink p-3.5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                on ? "bg-ink text-paper" : "hover:bg-tint",
              )}
            >
              <input
                type="radio"
                name="visibility"
                className="sr-only"
                checked={on}
                disabled={update.isPending}
                onChange={() => change(option.value)}
              />
              <span className="label font-bold">{option.title}</span>
              <span className={cn("font-body text-sm", on ? "text-paper/75" : "text-faded")}>
                {option.hint}
              </span>
            </label>
          );
        })}
      </fieldset>
      {shown && (
        <div className="flex items-stretch border-[1.5px] border-ink">
          <Link to={path} className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-[12px] hover:bg-tint">
            {window.location.host + path}
          </Link>
          <button
            type="button"
            onClick={() => void copy()}
            className="label flex shrink-0 items-center gap-1.5 border-l-[1.5px] border-ink px-3 font-bold hover:bg-ink hover:text-paper"
          >
            <Copy className="size-3.5" strokeWidth={2.5} />
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

export default VisibilityForm;
