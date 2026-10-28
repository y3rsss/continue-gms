import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "./useSession";

const COLUMNS = "username, display_name, avatar_url, is_public";

export const useProfile = () => {
  const userId = useUser()?.id;

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", userId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export type Profile = NonNullable<ReturnType<typeof useProfile>["data"]>;

export const useUpdateProfile = () => {
  const userId = useUser()?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes: Partial<Pick<Profile, "username" | "display_name" | "is_public">>) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(changes)
        .eq("id", userId!)
        .select(COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) => queryClient.setQueryData(["profile", userId], profile),
  });
};
