import { useRef, type KeyboardEvent } from "react";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import { openAuth } from "../../hooks/useAuthDialog";

const OPTIONS = [
  { view: "signin", title: "Continue" },
  { view: "signup", title: "New game" },
] as const;

const ModeMenu = ({ view }: { view: "signin" | "signup" }) => {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = view === "signin" ? 1 : 0;
    openAuth(OPTIONS[next].view);
    buttons.current[next]?.focus();
  };

  return (
    <>
      <Dialog.Title className="sr-only">{view === "signin" ? "Sign in" : "Create an account"}</Dialog.Title>
      <div
        role="radiogroup"
        aria-label="Do you have an account?"
        onKeyDown={onKeyDown}
        className="mb-1.5 grid gap-0.5"
      >
        {OPTIONS.map((option, i) => {
          const on = option.view === view;
          return (
            <button
              key={option.view}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => openAuth(option.view)}
              className="group -ml-4.5 flex items-center gap-1.5 text-left sm:-ml-7.5 sm:gap-2.5"
            >
              <span className="flex w-3 shrink-0 sm:w-5">
                {on && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="w-full animate-[blink_1.1s_steps(1)_infinite] fill-current"
                  >
                    <path d="M6 3v18l15-9z" />
                  </svg>
                )}
              </span>
              <span
                className={cn(
                  "wide text-[40px] leading-[0.92] font-black tracking-[-0.045em] whitespace-nowrap uppercase transition-colors sm:text-[54px]",
                  on
                    ? "text-ink"
                    : "text-transparent [-webkit-text-stroke:1.5px_var(--ink)] group-hover:text-ink/15",
                )}
              >
                {option.title}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ModeMenu;
