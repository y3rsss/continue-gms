import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { PASSWORD_HINT } from "./password";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed: "Confirm your email first. The link is in your inbox.",
  weak_password: PASSWORD_HINT,
  same_password: "That's your current password. Pick a new one.",
  email_address_invalid: "That email doesn't look right.",
  user_already_exists: "There's already an account with this email. Sign in instead.",
  email_exists: "There's already an account with this email. Sign in instead.",
  over_email_send_rate_limit: "Too many emails sent. Wait a minute and try again.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  signup_disabled: "Sign-ups are closed right now.",
};

export function authMessage(error: AuthError) {
  if (isAuthRetryableFetchError(error)) return "Can't reach the server. Check your connection and try again.";
  return (error.code && MESSAGES[error.code]) || error.message;
}
