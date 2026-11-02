import { describe, expect, it } from "vitest";
import { USERNAME, cleanUsername, usernameFromEmail } from "./username";

describe("cleanUsername", () => {
  it("lowercases and keeps only letters, numbers and _", () => {
    expect(cleanUsername("Yers.Abu-1_x")).toBe("yersabu1_x");
  });
});

describe("usernameFromEmail", () => {
  it("uses the part before the @", () => {
    expect(usernameFromEmail("New.Player@example.com")).toBe("newplayer");
  });

  it("cuts long names to 20 characters", () => {
    expect(usernameFromEmail("abcdefghijklmnopqrstuvwxyz@example.com")).toBe("abcdefghijklmnopqrst");
  });

  it("falls back to player when too little is left", () => {
    expect(usernameFromEmail("a.b@example.com")).toBe("player");
  });
});

describe("USERNAME", () => {
  it("allows 3 to 24 lowercase letters, numbers and _", () => {
    expect(USERNAME.test("yer")).toBe(true);
    expect(USERNAME.test("a".repeat(24))).toBe(true);
    expect(USERNAME.test("ab")).toBe(false);
    expect(USERNAME.test("a".repeat(25))).toBe(false);
    expect(USERNAME.test("Yers")).toBe(false);
    expect(USERNAME.test("yers!")).toBe(false);
  });
});
