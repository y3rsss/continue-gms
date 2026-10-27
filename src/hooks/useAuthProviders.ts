import { useQuery, type QueryClient } from "@tanstack/react-query";

export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const options = {
  queryKey: ["auth-providers"],
  queryFn: async () => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    });
    if (!res.ok) throw new Error(`Auth settings failed with ${res.status}`);
    const { external } = (await res.json()) as { external: Record<string, boolean> };
    return OAUTH_PROVIDERS.filter((provider) => external[provider]);
  },
  staleTime: Infinity,
};

// only show buttons for providers that are switched on in the dashboard
export const useAuthProviders = () => useQuery(options);

export const prefetchAuthProviders = (client: QueryClient) => client.prefetchQuery(options);
