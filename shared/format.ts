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
