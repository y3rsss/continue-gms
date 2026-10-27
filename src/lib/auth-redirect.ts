import { toast } from "./toast";

export interface AuthRedirect {
  type: string | null;
  code: string | null;
  error: string | null;
}

export function readAuthRedirect(hash: string): AuthRedirect {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return { type: params.get("type"), code: params.get("error_code"), error: params.get("error_description") };
}

// read before supabase-js consumes the hash, it removes the tokens once it has a session
export const authRedirect = readAuthRedirect(typeof window === "undefined" ? "" : window.location.hash);

export function announceAuthRedirect() {
  const { type, code, error } = authRedirect;
  // the reset page explains its own link problems
  if (window.location.pathname === "/reset-password") return;
  if (error) {
    toast(
      code === "otp_expired"
        ? "That link expired or was already used. Ask for a new one."
        : `Couldn't sign in: ${error}`,
      "alert",
    );
    history.replaceState(history.state, "", window.location.pathname + window.location.search);
  } else if (type === "signup") {
    toast("Email confirmed. You're signed in.");
  }
}
