import type { Game } from "@shared/types";
import { STATUS_STYLE } from "@/lib/status";
import { cn } from "@/lib/utils";
import { STATUSES, setStatus, useStatus, type Status } from "../hooks/useBacklog";

const BacklogStamps = ({ game }: { game: Game }) => {
  const current = useStatus(game.slug);

  return (
    <div className="grid gap-2">
      <span className="label text-faded">{current ? "On your backlog" : "Add to your backlog"}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Backlog status">
        {(Object.keys(STATUSES) as Status[]).map((status) => {
          const on = status === current;
          const { icon: Icon, className } = STATUS_STYLE[status];
          return (
            <button
              key={status}
              type="button"
              aria-pressed={on}
              onClick={() => setStatus(game, on ? null : status)}
              className={cn(
                "label inline-flex items-center gap-1.5 border-2 px-2.5 py-2 font-bold tracking-[0.06em]",
                on ? cn("-rotate-3 animate-[stamp_.28s_cubic-bezier(.2,1.6,.4,1)]", className) : "border-ink hover:bg-tint"
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
              {STATUSES[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BacklogStamps;
