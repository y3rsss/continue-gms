import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { USERNAME } from "@/lib/username";
import useDebounce from "./useDebounce";

export type UsernameStatus = "same" | "invalid" | "checking" | "taken" | "free";

export const useUsernameStatus = (name: string, current: string): UsernameStatus => {
  const settled = useDebounce(name, 300);
  const valid = USERNAME.test(name);

  const { data: available } = useQuery({
    queryKey: ["username-available", settled],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("username_available", { name: settled });
      if (error) throw error;
      return data;
    },
    enabled: valid && settled === name && name !== current,
    staleTime: 30_000,
  });

  if (name === current) return "same";
  if (!valid) return "invalid";
  if (settled !== name || available === undefined) return "checking";
  return available ? "free" : "taken";
};
