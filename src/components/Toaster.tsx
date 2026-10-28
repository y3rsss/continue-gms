import { useEffect } from "react";
import { Check, CircleAlert, X } from "lucide-react";
import { dismissToast, useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const Toaster = () => {
  const current = useToast();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => dismissToast(current.id), 6000);
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex sm:right-auto sm:bottom-6 sm:left-7"
    >
      {current && (
        <div
          key={current.id}
          className="pointer-events-auto flex items-center gap-3.5 bg-ink py-2.5 pr-1.5 pl-3 text-paper shadow-[6px_6px_0_rgb(0_0_0/.3)] animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <span
            aria-hidden
            className={cn(
              "grid size-6 shrink-0 place-items-center text-white",
              current.tone === "ok" ? "bg-playing" : "bg-house",
            )}
          >
            {current.tone === "ok" ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : (
              <CircleAlert className="size-3.5" strokeWidth={2.5} />
            )}
          </span>
          <span className="font-body text-[15px] font-semibold">{current.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(current.id)}
            className="grid size-8 shrink-0 place-items-center hover:opacity-70"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Toaster;
