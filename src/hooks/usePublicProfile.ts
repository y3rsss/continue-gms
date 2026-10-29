import { useQuery } from "@tanstack/react-query";
import { fromRows } from "@/lib/backlog-sync";
import { supabase } from "@/lib/supabase";
import { useSession } from "./useSession";

// null when there's no such username or it's someone else's private profile, rls hides both the same way
export const usePublicProfile = (username: string) => {
  const session = useSession();
  // rls answers differently per viewer, so a signed out visit must not reuse a signed in result
  const viewer = session?.user.id ?? null;

  return useQuery({
    queryKey: ["public-profile", username, viewer],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, is_public, backlog_entries(game_slug, status, game, updated_at)",
        )
        .eq("username", username)
        .order("updated_at", { referencedTable: "backlog_entries", ascending: false })
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { backlog_entries, ...profile } = data;
      return { profile, entries: fromRows(backlog_entries).map(([, entry]) => entry) };
    },
    enabled: session !== undefined,
  });
};
