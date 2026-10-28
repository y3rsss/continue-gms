import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useUpdateProfile, type Profile } from "../../hooks/useProfile";

const VisibilityForm = ({ profile }: { profile: Profile }) => {
  const update = useUpdateProfile();
  const shown = update.isPending ? update.variables.is_public : profile.is_public;

  const options = [
    { value: false, title: "Private", hint: "Only you can see your shelf." },
    { value: true, title: "Public", hint: `Anyone can see it at /u/${profile.username}.` },
  ];

  const change = (is_public: boolean) =>
    update.mutate(
      { is_public },
      {
        onSuccess: () => toast(is_public ? "Your shelf is public." : "Your shelf is private."),
        onError: () => toast("Couldn't change who sees your shelf. Try again.", "alert"),
      },
    );

  return (
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="sr-only">Who can see your shelf</legend>
      {options.map((option) => {
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
            <span className={cn("font-body text-sm break-all", on ? "text-paper/75" : "text-faded")}>
              {option.hint}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};

export default VisibilityForm;
