import { cn } from "@/lib/utils";
import { STATUS_STYLE } from "@/lib/status";
import { STATUSES, type Status } from "../hooks/useBacklog";

interface Props {
  status: Status;
  small?: boolean;
}

const StatusStamp = ({ status, small }: Props) => {
  const { icon: Icon, className } = STATUS_STYLE[status];

  return (
    <span
      className={cn(
        "label inline-flex items-center gap-1 font-bold",
        small
          ? "mr-1.5 px-1 py-px align-[1px] text-[9.5px]"
          : "absolute top-2.5 left-2.5 -rotate-4 border-2 px-1.5 py-1 text-[10px] tracking-[0.08em] shadow-[2px_2px_0_rgb(0_0_0/.35)]",
        className
      )}
    >
      <Icon className={small ? "size-2.5" : "size-3"} strokeWidth={3} />
      {STATUSES[status]}
    </span>
  );
};

export default StatusStamp;
