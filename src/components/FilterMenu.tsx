import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Option {
  value: string | undefined;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const FilterMenu = ({ label, options, value, onChange }: Props) => {
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="label inline-flex items-center gap-1.5 border-[1.5px] border-ink px-2.5 py-1.5 whitespace-nowrap hover:bg-tint data-[state=open]:bg-ink data-[state=open]:text-paper">
        <span className="text-faded">{label}</span> {current.label}
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-auto min-w-48 border-[1.5px] border-ink p-0 shadow-[4px_4px_0_var(--ink)] ring-0"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value ?? "all"}
            onSelect={() => onChange(option.value)}
            className={cn("label justify-between px-3 py-2", option.value === value && "font-bold")}
          >
            {option.label}
            {option.value === value && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FilterMenu;
