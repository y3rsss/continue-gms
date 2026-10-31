import type { Price } from "@shared/types";
import { discount, priceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const PriceTag = ({ price }: { price: Price }) => {
  const off = discount(price.amount, price.regular);

  return (
    <span className="label absolute right-0 bottom-0 flex text-[11px] font-bold">
      {off > 0 && <span className="bg-house px-1.5 py-1 text-white">−{off}%</span>}
      <span className="bg-ink px-1.5 py-1 text-paper">
        <span className="sr-only">Best price </span>
        {priceLabel(price.amount)}
      </span>
    </span>
  );
};

export const PriceText = ({ price, className }: { price: Price; className?: string }) => {
  const off = discount(price.amount, price.regular);

  return (
    <span className={cn("label inline-flex items-center gap-1.5 font-bold", className)}>
      {off > 0 && <span className="bg-house px-1 text-white">−{off}%</span>}
      {priceLabel(price.amount)}
    </span>
  );
};

export default PriceTag;
