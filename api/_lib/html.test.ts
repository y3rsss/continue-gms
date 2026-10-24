import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html.js";

describe("escapeHtml", () => {
  it("replaces the five characters that have a meaning in HTML", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#039;");
  });

  it("leaves normal text alone", () => {
    expect(escapeHtml("Hollow Knight")).toBe("Hollow Knight");
  });

  it("turns a script injection into harmless text", () => {
    const escaped = escapeHtml(`Cool Game"><script>stealCookies()</script>`);
    expect(escaped).toBe("Cool Game&quot;&gt;&lt;script&gt;stealCookies()&lt;/script&gt;");
    expect(escaped).not.toContain("<");
  });

  it("escapes & first, so text that looks like an entity stays visible", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});
