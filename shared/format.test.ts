import { describe, expect, it } from "vitest";
import { firstSentence, money, monthYear, percentOff } from "./format.js";

describe("money", () => {
  it("formats dollars with cents", () => {
    expect(money(17.99)).toBe("$17.99");
    expect(money(5)).toBe("$5.00");
  });
});

describe("percentOff", () => {
  it("rounds the discount to a whole percent", () => {
    expect(percentOff(17.99, 59.99)).toBe(70);
    expect(percentOff(24.99, 49.99)).toBe(50);
  });

  it("is 0 when the price isn't reduced", () => {
    expect(percentOff(14.99, 14.99)).toBe(0);
  });
});

describe("monthYear", () => {
  it("keeps the date's own month in every timezone", () => {
    expect(monthYear("2024-05-01")).toBe("May 2024");
    expect(monthYear("2019-12-31")).toBe("Dec 2019");
  });
});

describe("firstSentence", () => {
  it("stops at the end of the first sentence", () => {
    expect(firstSentence("Prove your worth! Explore a vast world.")).toBe("Prove your worth!");
  });

  it("shortens long sentences with an ellipsis", () => {
    const result = firstSentence("a".repeat(200), 20);
    expect(result).toBe(`${"a".repeat(20)}…`);
  });
});
