import { useQuery } from "@tanstack/react-query";
import { supabase, isConfigured } from "../lib/supabaseClient";

/** Único dato visible sin cuenta: un número, nunca filas ni desglose por rubro. */
export function useMemberCount() {
  return useQuery({
    queryKey: ["memberCount"],
    enabled: isConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("contar_miembros");
      if (error || data == null) return null;
      return Number(data);
    },
  });
}
