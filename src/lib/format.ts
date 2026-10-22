import type { Platform } from "@shared/types";

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

export const firstSentence = (text: string, max = 160) => {
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? "";
  return sentence.length > max ? `${sentence.slice(0, max).trimEnd()}…` : sentence;
};

export const money = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const percentOff = (price: number, regularPrice: number) =>
  Math.round((1 - price / regularPrice) * 100);

export const monthYear = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
