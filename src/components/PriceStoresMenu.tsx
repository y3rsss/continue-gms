import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Shop } from "@shared/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setPriceStores, usePriceStores } from "../hooks/usePriceStores";
import useShops from "../hooks/useShops";

const ITEM = "label justify-between px-3 py-2";

const summary = (stores: number[], shops: Shop[] | undefined) => {
  const chosen = shops ? shops.filter((shop) => stores.includes(shop.id)) : [];
  if (stores.length === 0) return "All stores";
  if (stores.length === 1) return chosen[0]?.name ?? "1 store";
  return `${stores.length} stores`;
};

const PriceStoresMenu = () => {
  const [open, setOpen] = useState(false);
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const stores = usePriceStores();
  const shops = useShops(open || stores.length > 0);

  useEffect(() => {
    if (!shops.data) return;
    const known = new Set(shops.data.map((shop) => shop.id));
    if (stores.some((id) => !known.has(id))) setPriceStores(stores.filter((id) => known.has(id)));
  }, [shops.data, stores]);

  const toggle = (id: number) =>
    setPriceStores(stores.includes(id) ? stores.filter((other) => other !== id) : [...stores, id]);

  const label = summary(stores, shops.data);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setOpenLabel(next ? label : null);
      }}
    >
      <DropdownMenuTrigger className="label inline-flex items-center gap-1.5 border-[1.5px] border-ink px-2.5 py-1.5 whitespace-nowrap hover:bg-tint data-[state=open]:bg-ink data-[state=open]:text-paper">
        <span className="text-faded">Prices from</span> {openLabel ?? label}
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(26rem,var(--radix-dropdown-menu-content-available-height))] w-auto min-w-56 overflow-y-auto border-[1.5px] border-ink p-0 shadow-[4px_4px_0_var(--ink)] ring-0"
      >
        <DropdownMenuItem
          role="menuitemcheckbox"
          aria-checked={stores.length === 0}
          onSelect={() => setPriceStores([])}
          className={cn(ITEM, stores.length === 0 && "font-bold")}
        >
          All stores
          {stores.length === 0 && <Check className="size-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="m-0 bg-ink" />
        {shops.isError && !shops.data && (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void shops.refetch();
            }}
            className="px-3 py-2 font-body text-sm text-faded"
          >
            Couldn't load the stores. Try again.
          </DropdownMenuItem>
        )}
        {shops.isPending &&
          [24, 16, 28].map((width) => (
            <span
              key={width}
              aria-hidden
              className="mx-3 my-2.5 block h-3 animate-pulse bg-tint"
              style={{ width: `${width * 4}px` }}
            />
          ))}
        {shops.data?.map((shop) => {
          const checked = stores.includes(shop.id);
          return (
            <DropdownMenuItem
              key={shop.id}
              role="menuitemcheckbox"
              aria-checked={checked}
              onSelect={(event) => {
                event.preventDefault();
                toggle(shop.id);
              }}
              className={cn(ITEM, checked && "font-bold")}
            >
              {shop.name}
              {checked && <Check className="size-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PriceStoresMenu;
