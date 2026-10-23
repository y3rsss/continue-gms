import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { Media } from "@shared/types";
import { cn } from "@/lib/utils";
import { wrapIndex } from "@/lib/wrap";
import useArrowKeys from "../hooks/useArrowKeys";
import VideoPlayer from "./VideoPlayer";

interface Props {
  media: Media[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  title: string;
  spot: string | undefined;
}

const keyOf = (item: Media) => (item.kind === "image" ? item.full : item.src);
const thumbOf = (item: Media) => (item.kind === "image" ? item.thumb : item.poster);
const pad = (n: number) => String(n).padStart(2, "0");

const KEY = "border border-[#e9ebef]/40 px-1 font-mono text-[10px]";

const ARROW =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center border-2 border-[#e9ebef] bg-[#0d0f13]/80 text-[#e9ebef] hover:border-spot hover:bg-spot hover:text-white";

const Gallery = ({ media, index, onIndexChange, title, spot }: Props) => {
  const [loaded, setLoaded] = useState<Record<string, true>>({});
  const touchStart = useRef<number | null>(null);
  const activeThumb = useRef<HTMLButtonElement>(null);

  const open = index !== null && media.length > 0;
  const current = open ? media[index] : null;

  const go = (delta: number) => {
    if (index !== null) onIndexChange(wrapIndex(index + delta, media.length));
  };
  const previous = () => go(-1);
  const next = () => go(1);

  useArrowKeys(previous, next, open && media.length > 1);

  useEffect(() => {
    if (index === null) return;
    for (const delta of [-1, 1]) {
      const neighbour = media[wrapIndex(index + delta, media.length)];
      if (neighbour?.kind === "image") new Image().src = neighbour.full;
    }
    activeThumb.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index, media]);

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          style={{ "--spot": spot ?? "#d8352a" } as CSSProperties}
          className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)_auto] bg-[#0d0f13] text-[#e9ebef] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <Dialog.Title className="sr-only">{`${title} screenshots and trailers`}</Dialog.Title>

          <div className="flex items-center gap-4 border-b-[3px] border-[#e9ebef] px-4 py-3 sm:px-7">
            {index !== null && (
              <span className="wide shrink-0 text-2xl font-black tabular-nums">
                {pad(index + 1)}
                <span className="text-[#e9ebef]/40"> / {pad(media.length)}</span>
              </span>
            )}
            <span className="narrow min-w-0 flex-1 truncate text-xl font-extrabold uppercase">
              {title}
              {current?.kind === "video" && <span className="text-spot"> {current.title}</span>}
            </span>
            {current?.kind === "video" && (
              <span className="label hidden shrink-0 items-center gap-1.5 text-[10px] text-[#e9ebef]/60 lg:flex">
                <kbd className={KEY}>Space</kbd> play
                <kbd className={`${KEY} ml-2`}>J</kbd>
                <kbd className={KEY}>L</kbd> skip 5s
                <kbd className={`${KEY} ml-2`}>M</kbd> mute
                <kbd className={`${KEY} ml-2`}>F</kbd> fullscreen
              </span>
            )}
            <Dialog.Close
              aria-label="Close"
              className="label grid size-10 shrink-0 place-items-center border-2 border-[#e9ebef] hover:border-spot hover:bg-spot hover:text-white"
            >
              <X className="size-4" strokeWidth={2.5} />
            </Dialog.Close>
          </div>

          <div
            className="relative flex min-h-0 items-center justify-center px-4 py-4 sm:px-20"
            onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (start === null || media.length < 2) return;
              const distance = event.changedTouches[0].clientX - start;
              if (Math.abs(distance) > 50) (distance < 0 ? next : previous)();
            }}
          >
            {media.length > 1 && (
              <button
                type="button"
                aria-label="Previous"
                onClick={previous}
                className={cn(ARROW, "left-2 sm:left-5")}
              >
                <ChevronLeft className="size-5" strokeWidth={2.5} />
              </button>
            )}

            {current?.kind === "image" && (
              <>
                {!loaded[current.full] && (
                  <span className="label absolute animate-pulse text-[#e9ebef]/60">Loading</span>
                )}
                <img
                  key={current.full}
                  src={current.full}
                  alt={`${title} screenshot ${index! + 1}`}
                  onLoad={() => setLoaded((all) => ({ ...all, [current.full]: true }))}
                  className={cn(
                    "max-h-full max-w-full border-[3px] border-[#e9ebef] object-contain transition-opacity duration-300",
                    loaded[current.full] ? "opacity-100" : "opacity-0",
                  )}
                />
              </>
            )}

            {current?.kind === "video" && (
              <VideoPlayer
                key={current.src}
                src={current.src}
                poster={current.poster}
                title={current.title}
              />
            )}

            {media.length > 1 && (
              <button
                type="button"
                aria-label="Next"
                onClick={next}
                className={cn(ARROW, "right-2 sm:right-5")}
              >
                <ChevronRight className="size-5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t-[1.5px] border-[#e9ebef]/20 px-4 py-3 [scrollbar-width:thin] sm:px-7">
              {media.map((item, i) => {
                const active = i === index;
                const thumb = thumbOf(item);
                return (
                  <button
                    key={keyOf(item)}
                    ref={active ? activeThumb : undefined}
                    type="button"
                    aria-label={item.kind === "video" ? `Trailer: ${item.title}` : `Screenshot ${i + 1}`}
                    aria-current={active}
                    onClick={() => onIndexChange(i)}
                    className={cn(
                      "relative aspect-video h-14 shrink-0 overflow-hidden border-2 bg-[#1b1e25] sm:h-16",
                      active ? "border-spot" : "border-transparent opacity-50 hover:opacity-100",
                    )}
                  >
                    {thumb && <img src={thumb} alt="" loading="lazy" className="size-full object-cover" />}
                    {item.kind === "video" && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-6 place-items-center bg-spot text-white">
                          <Play className="size-3 fill-current" />
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Gallery;
