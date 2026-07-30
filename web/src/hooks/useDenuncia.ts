import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { MotivoDenuncia } from "../constants/denuncias";
import type { ConversationTarget } from "./useConversationThread";

/**
 * Denuncia propia sobre una conversación puntual (una publicación + la otra
 * persona) — ver reglas.md ("Denuncias"). Solo se puede denunciar si hubo
 * intercambio de mensajes real (lo exige la policy
 * insert_denuncia_tras_intercambio del lado del servidor).
 *
 * A diferencia de las reseñas, acá no hay forma de consultar "¿ya
 * denuncié a esta persona?" -- la tabla denuncias no tiene ninguna policy
 * de select ni para el propio denunciante (nadie la lee salvo HQ Metales),
 * así que "yaDenuncie" es solo un recuerdo del lado del cliente para esta
 * sesión (se resetea si se cierra y se vuelve a abrir la conversación). Si
 * alguien intenta denunciar dos veces a la misma persona por la misma
 * publicación, el `unique(denunciante_id, publicacion_id)` del lado del
 * servidor lo rechaza igual, solo que con un error menos prolijo.
 */
export function useDenuncia(userId: string | undefined, target: ConversationTarget | null) {
  const [yaDenuncie, setYaDenuncie] = useState(false);

  // El modal de conversación no se remonta al cambiar de conversación (ver
  // ConversationModal.tsx, mismo patrón que el reseteo de "body") -- sin
  // esto, "ya denuncié" de una conversación se pisaría a la siguiente.
  useEffect(() => {
    setYaDenuncie(false);
  }, [target?.publicacionId, target?.otraId]);

  async function enviarDenuncia(motivo: MotivoDenuncia, comentario: string): Promise<string | null> {
    if (!userId || !target) return null;
    const { error } = await supabase.from("denuncias").insert({
      publicacion_id: target.publicacionId,
      denunciante_id: userId,
      denunciado_id: target.otraId,
      motivo,
      comentario: comentario || null,
    });
    if (error) return error.message;
    setYaDenuncie(true);
    return null;
  }

  return { yaDenuncie, enviarDenuncia };
}
