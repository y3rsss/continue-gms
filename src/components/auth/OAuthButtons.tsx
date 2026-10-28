import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { authMessage } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthProviders, type OAuthProvider } from "../../hooks/useAuthProviders";
import { GitHubMark, GoogleMark } from "./BrandIcons";
import { FormError } from "./fields";

const PROVIDERS = {
  google: { name: "Google", icon: <GoogleMark className="size-4" /> },
  github: { name: "GitHub", icon: <GitHubMark className="size-[18px]" /> },
};

const OAuthButtons = ({ verb }: { verb: "Continue" | "Sign up" }) => {
  const { data: providers, isPending } = useAuthProviders();
  const [leaving, setLeaving] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isPending) return <div aria-hidden className="h-12 animate-pulse bg-tint" />;
  if (!providers?.length) return null;

  const go = async (provider: OAuthProvider) => {
    setLeaving(provider);
    setError(null);
    // on success the browser leaves for the provider and comes back here signed in
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (error) {
      setLeaving(null);
      setError(authMessage(error));
    }
  };

  return (
    <div className="grid gap-4.5">
      <div className={cn("grid gap-2", providers.length > 1 && "sm:grid-cols-2")}>
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={leaving !== null}
            onClick={() => void go(provider)}
            className="label flex h-12 items-center justify-center gap-2.5 border-2 border-ink font-bold hover:bg-tint disabled:opacity-60"
          >
            {leaving === provider ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              PROVIDERS[provider].icon
            )}
            {verb} with {PROVIDERS[provider].name}
          </button>
        ))}
      </div>
      {error && <FormError>{error}</FormError>}
      <div className="flex items-center gap-3 text-faded">
        <span className="flex-1 border-t-[1.5px] border-ink" />
        <span className="label">or with email</span>
        <span className="flex-1 border-t-[1.5px] border-ink" />
      </div>
    </div>
  );
};

export default OAuthButtons;
