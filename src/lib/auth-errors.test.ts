import { describe, expect, it } from "vitest";
import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { authMessage } from "./auth-errors";

describe("authMessage", () => {
  it("explains known error codes in plain words", () => {
    expect(authMessage(new AuthApiError("Invalid login credentials", 400, "invalid_credentials"))).toBe(
      "Wrong email or password.",
    );
    expect(authMessage(new AuthApiError("Same password", 422, "same_password"))).toBe(
      "That's your current password. Pick a new one.",
    );
  });

  it("falls back to Supabase's own message for unknown codes", () => {
    expect(authMessage(new AuthApiError("Something new", 400, "brand_new_code"))).toBe("Something new");
  });

  it("asks to check the connection when the server can't be reached", () => {
    expect(authMessage(new AuthRetryableFetchError("Failed to fetch", 0))).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
  });
});
