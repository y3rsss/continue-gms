import { supabase } from "./supabase";

export const sendConfirmation = (email: string) =>
  supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });

export const sendPasswordReset = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
