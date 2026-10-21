import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface Props extends ComponentProps<"button"> {
  active?: boolean;
}

const Tab = ({ active, className, ...props }: Props) => {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "label inline-flex shrink-0 items-center gap-1.5 border-[1.5px] border-ink px-2.5 py-1.5 whitespace-nowrap",
        active ? "bg-ink text-paper" : "hover:bg-tint",
        className,
      )}
      {...props}
    />
  );
};

export default Tab;
