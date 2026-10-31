import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface Props {
  items: (string | null | undefined)[];
  className?: string;
}

const Meta = ({ items, className }: Props) => {
  const shown = items.filter((item): item is string => !!item);

  return (
    <span className={cn("label flex min-w-0 items-center gap-2 text-[10.5px] text-faded", className)}>
      {shown.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && <span aria-hidden className="h-2.5 w-px shrink-0 bg-current opacity-40" />}
          <span className={i < shown.length - 1 ? "shrink-0" : "truncate"}>{item}</span>
        </Fragment>
      ))}
    </span>
  );
};

export default Meta;
