import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { ComunidadPublicacionRow } from "../lib/database.types";

export const COMUNIDAD_PUBLICACIONES_KEY = ["comunidadPublicaciones"];

/** Compartido entre BuscarPage y GuardadosPage -- ambos muestran publicaciones
 * de la vista comunidad_publicaciones y necesitan la misma lógica de like. */
export function useLikes(userId: string | undefined) {
  const queryClient = useQueryClient();
  const likesKey = ["misLikes", userId];

  const { data: misLikedIds = new Set<string>() } = useQuery({
    queryKey: likesKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase
        .from("publicacion_likes")
        .select("publicacion_id")
        .eq("user_id", userId as string);
      return new Set((data ?? []).map((l) => l.publicacion_id));
    },
  });

  async function toggleLike(id: string): Promise<string | null> {
    if (!userId) return null;
    const yaLiked = misLikedIds.has(id);
    if (yaLiked) {
      const { error } = await supabase
        .from("publicacion_likes")
        .delete()
        .eq("publicacion_id", id)
        .eq("user_id", userId);
      if (error) return error.message;
      queryClient.setQueryData<Set<string>>(likesKey, (prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      queryClient.setQueryData<ComunidadPublicacionRow[]>(COMUNIDAD_PUBLICACIONES_KEY, (prev) =>
        (prev ?? []).map((p) =>
          p.id === id ? { ...p, likes_count: Math.max(0, (Number(p.likes_count) || 0) - 1) } : p
        )
      );
    } else {
      const { error } = await supabase.from("publicacion_likes").insert({ publicacion_id: id, user_id: userId });
      if (error) return error.message;
      queryClient.setQueryData<Set<string>>(likesKey, (prev) => new Set(prev).add(id));
      queryClient.setQueryData<ComunidadPublicacionRow[]>(COMUNIDAD_PUBLICACIONES_KEY, (prev) =>
        (prev ?? []).map((p) => (p.id === id ? { ...p, likes_count: (Number(p.likes_count) || 0) + 1 } : p))
      );
    }
    return null;
  }

  return { misLikedIds, toggleLike };
}
