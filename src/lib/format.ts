import type { Platform } from "@shared/types";

export { discount, firstSentence, money, monthYear, percentOff, priceLabel } from "@shared/format";

export const year = (date: string | null) => date?.slice(0, 4) ?? "TBA";

export const fullDate = (date: string | null) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "TBA";

const PLATFORM_ABBR: Record<string, string> = {
  pc: "PC",
  playstation: "PS",
  xbox: "XBX",
  nintendo: "NIN",
  mac: "MAC",
  linux: "LNX",
  ios: "IOS",
  android: "AND",
  web: "WEB",
};

export const platformAbbr = (platforms: Platform[]) =>
  platforms.map((p) => PLATFORM_ABBR[p.slug] ?? p.name.toUpperCase()).join(" ");

export const count = (n: number) => n.toLocaleString("en-US");
