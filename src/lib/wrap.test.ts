import { describe, expect, it } from "vitest";
import { wrapIndex } from "./wrap";

describe("wrapIndex", () => {
  it("keeps positions that are already inside the list", () => {
    expect(wrapIndex(0, 8)).toBe(0);
    expect(wrapIndex(3, 8)).toBe(3);
    expect(wrapIndex(7, 8)).toBe(7);
  });

  it("wraps past the end back to the start", () => {
    expect(wrapIndex(8, 8)).toBe(0);
    expect(wrapIndex(9, 8)).toBe(1);
  });

  it("wraps before the start around to the end", () => {
    expect(wrapIndex(-1, 8)).toBe(7);
    expect(wrapIndex(-9, 8)).toBe(7);
  });

  it("always lands on the only item of a one-item list", () => {
    expect(wrapIndex(1, 1)).toBe(0);
    expect(wrapIndex(-1, 1)).toBe(0);
  });
});
