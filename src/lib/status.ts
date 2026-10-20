import { Bookmark, Check, Play, X, type LucideIcon } from "lucide-react";
import type { Status } from "../hooks/useBacklog";

export const STATUS_STYLE: Record<Status, { icon: LucideIcon; className: string; swatch: string }> = {
  want: { icon: Bookmark, className: "border-want bg-want text-[#15171c]", swatch: "bg-want" },
  playing: { icon: Play, className: "border-playing bg-playing text-white", swatch: "bg-playing" },
  finished: { icon: Check, className: "border-ink bg-ink text-paper", swatch: "bg-ink" },
  dropped: { icon: X, className: "border-dropped bg-dropped text-white line-through", swatch: "bg-dropped" },
};
