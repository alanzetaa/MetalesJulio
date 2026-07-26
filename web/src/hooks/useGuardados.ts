import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export const MIS_GUARDADOS_KEY_PREFIX = "misGuardados";

/** Compartido entre BuscarPage (guardar desde un resultado) y GuardadosPage
 * (ver/quitar lo ya guardado) -- ver reglas.md ("Publicaciones guardadas"). */
export function useGuardados(userId: string | undefined) {
  const queryClient = useQueryClient();
  const guardadosKey = [MIS_GUARDADOS_KEY_PREFIX, userId];

  const { data: guardadoIds = new Set<string>(), isLoading } = useQuery({
    queryKey: guardadosKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase
        .from("publicaciones_guardadas")
        .select("publicacion_id")
        .eq("user_id", userId as string);
      return new Set((data ?? []).map((g) => g.publicacion_id));
    },
  });

  async function toggleGuardado(id: string): Promise<string | null> {
    if (!userId) return null;
    const yaGuardado = guardadoIds.has(id);
    if (yaGuardado) {
      const { error } = await supabase
        .from("publicaciones_guardadas")
        .delete()
        .eq("publicacion_id", id)
        .eq("user_id", userId);
      if (error) return error.message;
      queryClient.setQueryData<Set<string>>(guardadosKey, (prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      const { error } = await supabase.from("publicaciones_guardadas").insert({ publicacion_id: id, user_id: userId });
      if (error) return error.message;
      queryClient.setQueryData<Set<string>>(guardadosKey, (prev) => new Set(prev).add(id));
    }
    return null;
  }

  return { guardadoIds, toggleGuardado, isLoading };
}
