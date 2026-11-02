import { describe, expect, it } from "vitest";
import { missingRules, strongEnough } from "./password";

describe("strongEnough", () => {
  it("needs every rule", () => {
    expect(strongEnough("Correct-horse-1")).toBe(true);
    expect(strongEnough("correct-horse-1")).toBe(false);
    expect(strongEnough("CORRECT-HORSE-1")).toBe(false);
    expect(strongEnough("Correct-horse")).toBe(false);
    expect(strongEnough("Correcthorse1")).toBe(false);
    expect(strongEnough("C-h-1a")).toBe(false);
  });
});

describe("missingRules", () => {
  it("lists what's missing as a sentence", () => {
    expect(missingRules("abc")).toBe("8+ characters, an uppercase letter, a number and a symbol");
    expect(missingRules("Correcthorse1")).toBe("a symbol");
    expect(missingRules("Correct-horse-1")).toBe("");
  });
});
