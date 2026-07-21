import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export interface ConversationTarget {
  publicacionId: string;
  otraId: string;
  publicacionTitulo: string;
  otraNombre: string;
}

/**
 * Hilo de una conversación puntual (publicacion_id + las dos personas). Se
 * usa tanto desde "Buscar en la comunidad" (arrancar una conversación nueva)
 * como desde "Mensajes" (continuar una existente) — mismo componente,
 * openConversation() en la app vanilla.
 */
export function useConversationThread(target: ConversationTarget | null) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const queryKey = ["conversationThread", target?.publicacionId, target?.otraId];

  const query = useQuery({
    queryKey,
    enabled: Boolean(target && userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("mensajes_detalle")
        .select("*")
        .eq("publicacion_id", target!.publicacionId)
        .or(`remitente_id.eq.${target!.otraId},destinatario_id.eq.${target!.otraId}`)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!query.data || !userId || !target) return;
    const hayNoLeidos = query.data.some((m) => m.destinatario_id === userId && !m.leido_at);
    if (!hayNoLeidos) return;
    void supabase
      .from("mensajes")
      .update({ leido_at: new Date().toISOString() })
      .eq("publicacion_id", target.publicacionId)
      .eq("remitente_id", target.otraId)
      .eq("destinatario_id", userId)
      .is("leido_at", null)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["unreadCount", userId] });
        void queryClient.invalidateQueries({ queryKey: ["conversaciones", userId] });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, userId, target?.publicacionId, target?.otraId]);

  async function sendMessage(cuerpo: string) {
    if (!target || !userId) return { error: new Error("Sin destinatario") };
    const { error } = await supabase.from("mensajes").insert({
      publicacion_id: target.publicacionId,
      remitente_id: userId,
      destinatario_id: target.otraId,
      cuerpo,
    });
    if (!error) {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["conversaciones", userId] });
    }
    return { error };
  }

  return { messages: query.data ?? [], isLoading: query.isLoading, sendMessage };
}
