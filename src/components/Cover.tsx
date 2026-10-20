import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
  children?: ReactNode;
}

const Cover = ({ src, alt, className, eager, children }: Props) => {
  return (
    <div className={cn("relative aspect-[3/2] overflow-hidden border-[1.5px] border-ink bg-tint", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span className="label absolute inset-0 grid place-items-center text-faded">No image</span>
      )}
      {children}
    </div>
  );
};

export default Cover;
