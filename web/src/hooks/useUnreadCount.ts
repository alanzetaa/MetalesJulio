import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 30_000;

/**
 * Notificaciones sin Realtime, a propósito (para no sumar otra integración
 * frágil): se refresca al montar y con un setInterval cada 30s mientras la
 * app está abierta — ver reglas.md ("Actualización de datos sin recargar la
 * página a mano") para por qué esto reemplaza un recargado completo de la
 * página.
 */
export function useUnreadCount() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["unreadCount", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { count } = await supabase
        .from("mensajes")
        .select("*", { count: "exact", head: true })
        .eq("destinatario_id", userId as string)
        .is("leido_at", null);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => void query.refetch(), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { unreadCount: query.data ?? 0, refetchUnreadCount: query.refetch };
}
