import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  large?: boolean;
}

const Score = ({ value, large }: Props) => {
  if (value === null) {
    return large ? <span className="label text-center text-faded">n/a</span> : null;
  }

  return (
    <span
      className={cn(
        "wide shrink-0 font-black tabular-nums",
        value >= 90 ? "border-house bg-house text-white" : "border-ink",
        large ? "border-[2.5px] py-1 text-center text-xl" : "border-2 px-1.5 text-[15px]",
      )}
    >
      {value}
    </span>
  );
};

export default Score;
