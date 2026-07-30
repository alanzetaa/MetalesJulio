import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { ConversationTarget } from "./useConversationThread";

/**
 * Reseña propia sobre una conversación puntual (una publicación + la otra
 * persona) — ver reglas.md ("Reseñas y calificaciones"). Solo se puede
 * dejar una si hubo intercambio de mensajes real (lo exige la policy
 * insert_resena_tras_intercambio del lado del servidor).
 */
export function useResena(userId: string | undefined, target: ConversationTarget | null) {
  const queryClient = useQueryClient();
  const queryKey = ["miResena", userId, target?.publicacionId, target?.otraId];

  const { data: miResena, isLoading } = useQuery({
    queryKey,
    enabled: Boolean(userId && target),
    queryFn: async () => {
      const { data } = await supabase
        .from("resenas")
        .select("*")
        .eq("autor_id", userId as string)
        .eq("publicacion_id", target!.publicacionId)
        .eq("destinatario_id", target!.otraId)
        .maybeSingle();
      return data;
    },
  });

  async function enviarResena(
    puntajeProducto: number,
    puntajeComunicacion: number,
    puntajeTiempoForma: number,
    comentario: string
  ): Promise<string | null> {
    if (!userId || !target) return null;
    const { error } = await supabase.from("resenas").insert({
      publicacion_id: target.publicacionId,
      autor_id: userId,
      destinatario_id: target.otraId,
      puntaje_producto: puntajeProducto,
      puntaje_comunicacion: puntajeComunicacion,
      puntaje_tiempo_forma: puntajeTiempoForma,
      comentario: comentario || null,
    });
    if (error) return error.message;
    void queryClient.invalidateQueries({ queryKey });
    return null;
  }

  return { miResena, isLoading, enviarResena };
}
