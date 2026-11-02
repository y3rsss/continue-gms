import { describe, expect, it } from "vitest";
import { readAuthRedirect } from "./auth-redirect";

describe("readAuthRedirect", () => {
  it("reads errors from the query", () => {
    expect(
      readAuthRedirect("?error=access_denied&error_code=otp_expired&error_description=Link+expired", ""),
    ).toEqual({ type: null, code: "otp_expired", error: "Link expired" });
  });

  it("reads the link type from the hash", () => {
    expect(readAuthRedirect("", "#access_token=abc&type=signup")).toEqual({
      type: "signup",
      code: null,
      error: null,
    });
  });

  it("lets the hash win over the query", () => {
    expect(readAuthRedirect("?error_code=from_query", "#error_code=from_hash").code).toBe("from_hash");
  });

  it("finds nothing on a plain address", () => {
    expect(readAuthRedirect("", "")).toEqual({ type: null, code: null, error: null });
  });
});
