import { toast } from "./toast";

export interface AuthRedirect {
  type: string | null;
  code: string | null;
  error: string | null;
}

const ERROR_PARAMS = ["error", "error_code", "error_description"];

// errors can come back in the query or the hash, tokens always come in the hash
export function readAuthRedirect(search: string, hash: string): AuthRedirect {
  const params = new URLSearchParams(search);
  new URLSearchParams(hash.replace(/^#/, "")).forEach((value, key) => params.set(key, value));
  return { type: params.get("type"), code: params.get("error_code"), error: params.get("error_description") };
}

// read before supabase-js consumes the hash, it removes the tokens once it has a session
export const authRedirect =
  typeof window === "undefined"
    ? readAuthRedirect("", "")
    : readAuthRedirect(window.location.search, window.location.hash);

export function announceAuthRedirect() {
  const { type, code, error } = authRedirect;
  // the reset page explains its own link problems
  if (window.location.pathname === "/reset-password") return;
  if (error) {
    toast(
      code === "otp_expired"
        ? "That link expired or was already used. Ask for a new one."
        : code === "bad_oauth_state"
          ? "That sign-in expired or was already used. Try again."
          : `Couldn't sign in: ${error}`,
      "alert",
    );
    const url = new URL(window.location.href);
    ERROR_PARAMS.forEach((key) => url.searchParams.delete(key));
    url.hash = "";
    history.replaceState(history.state, "", url);
  } else if (type === "signup") {
    toast("Email confirmed. You're signed in.");
  }
}
