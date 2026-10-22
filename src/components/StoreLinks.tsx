import { ArrowUpRight } from "lucide-react";
import type { StoreLink } from "@shared/types";

const StoreLinks = ({ stores }: { stores: StoreLink[] | undefined }) => {
  if (!stores?.length) return null;

  return (
    <div className="grid gap-2">
      <span className="label text-faded">Where to buy</span>
      <div className="flex flex-wrap gap-2">
        {stores.map((store) => (
          <a
            key={store.url}
            href={store.url}
            target="_blank"
            rel="noreferrer"
            className="label inline-flex items-center gap-1 border-2 border-ink px-2.5 py-2 font-bold hover:border-spot hover:bg-spot hover:text-white"
          >
            {store.name}
            <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
          </a>
        ))}
      </div>
    </div>
  );
};

export default StoreLinks;
