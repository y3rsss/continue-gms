import { cn } from "@/lib/utils";

interface Props {
  value: number;
  className?: string;
}

const ScoreStamp = ({ value, className }: Props) => {
  return (
    <div
      className={cn(
        "wide relative grid aspect-square w-20 shrink-0 place-items-center border-4 text-[34px] leading-none font-black tabular-nums sm:w-24 sm:text-[42px]",
        className
      )}
    >
      {value}
      <small className="label absolute bottom-1.5 text-[8px] font-bold tracking-[0.08em]">Metascore</small>
    </div>
  );
};

export default ScoreStamp;
