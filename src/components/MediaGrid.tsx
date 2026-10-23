import { Play } from "lucide-react";
import type { Media } from "@shared/types";
import Cover from "./Cover";

const VISIBLE = 6;

interface Props {
  media: Media[];
  title: string;
  onOpen: (index: number) => void;
}

const MediaGrid = ({ media, title, onOpen }: Props) => {
  if (media.length === 0) return null;
  const unseen = media.length - (VISIBLE - 1);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {media.slice(0, VISIBLE).map((item, i) => {
        const more = i === VISIBLE - 1 && media.length > VISIBLE;
        const image = item.kind === "image" ? item.preview : item.poster;
        const label = more
          ? `Show all ${media.length} screenshots and trailers`
          : item.kind === "video"
            ? `Play trailer: ${item.title}`
            : `Open ${title} screenshot ${i + 1}`;

        return (
          <button
            key={item.kind === "image" ? item.full : item.src}
            type="button"
            aria-label={label}
            onClick={() => onOpen(i)}
            className="group relative text-left"
          >
            <Cover src={image} alt="" className="aspect-video group-hover:border-spot" />
            {item.kind === "video" && !more && (
              <span className="absolute inset-0 grid place-items-center">
                <span className="label flex items-center gap-1.5 bg-spot px-2 py-1.5 font-bold text-white">
                  <Play className="size-3 fill-current" />
                  Trailer
                </span>
              </span>
            )}
            {more && (
              <span className="wide absolute inset-0 grid place-items-center bg-[#0d0f13]/75 text-3xl font-black text-white group-hover:bg-[#0d0f13]/60">
                +{unseen}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MediaGrid;
