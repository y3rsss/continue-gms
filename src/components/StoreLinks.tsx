import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { StoreOffer, WhereToBuy } from "@shared/types";
import { discount, money, monthYear, priceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const VISIBLE = 5;

const Price = ({ offer }: { offer: StoreOffer }) => {
  if (offer.price === null) return null;
  const off = discount(offer.price, offer.regularPrice);

  return (
    <>
      {off > 0 && (
        <>
          <span className="bg-house px-1 text-white">−{off}%</span>
          <s className="font-normal opacity-60">
            <span className="sr-only">was </span>
            {money(offer.regularPrice!)}
          </s>
        </>
      )}
      <span>{priceLabel(offer.price)}</span>
    </>
  );
};

interface Props {
  data: WhereToBuy | undefined;
  loading: boolean;
}

const StoreLinks = ({ data, loading }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="grid gap-2">
        <span className="label text-faded">Where to buy</span>
        <div className="flex flex-wrap gap-2">
          {[28, 20, 32].map((width) => (
            <span key={width} className="h-9 animate-pulse bg-tint" style={{ width: `${width * 4}px` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.offers.length) return null;

  const { offers, lowestEver } = data;
  const best = offers.find((offer) => offer.price !== null);
  const collapsible = offers.length > VISIBLE + 1;
  const shown = collapsible && !expanded ? offers.slice(0, VISIBLE) : offers;
  const atLowest = best?.price != null && lowestEver !== null && best.price <= lowestEver.price;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="label text-faded">Where to buy</span>
        {best && <span className="label text-[10px] text-faded">PC prices in USD</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {shown.map((offer) => (
          <a
            key={offer.url}
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "label inline-flex items-center gap-1.5 border-2 border-ink px-2.5 py-2 font-bold hover:border-spot hover:bg-spot hover:text-white",
              offer === best && "bg-ink text-paper",
            )}
          >
            {offer.store}
            <Price offer={offer} />
            <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={2.5} />
          </a>
        ))}
        {collapsible && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="label px-1 py-2 text-faded underline-offset-4 hover:text-ink hover:underline"
          >
            {expanded ? "Show fewer" : `Show all ${offers.length} stores`}
          </button>
        )}
      </div>
      {lowestEver && (
        <p className={cn("label", atLowest ? "font-bold text-house" : "text-faded")}>
          {atLowest
            ? "Lowest price ever, right now"
            : `Lowest price ever: ${money(lowestEver.price)} in ${monthYear(lowestEver.date)}`}
        </p>
      )}
    </div>
  );
};

export default StoreLinks;
