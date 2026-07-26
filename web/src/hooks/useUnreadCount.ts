import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useBrowserNotifications } from "./useBrowserNotifications";
import { deberiaAvisarPorAumento } from "../utils/notifications";

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
  const { permission, requestPermission, notify, supported } = useBrowserNotifications();
  // null = todavía no sabemos el valor anterior (recién montado) -- no hay
  // que avisar en ese primer valor, solo cuando sube respecto al anterior.
  const prevCountRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (query.data == null) return;
    if (deberiaAvisarPorAumento(prevCountRef.current, query.data)) {
      notify("Tenés un mensaje nuevo", "Entrá a Comunidad Metales Julio para verlo.");
    }
    prevCountRef.current = query.data;
  }, [query.data, notify]);

  return {
    unreadCount: query.data ?? 0,
    refetchUnreadCount: query.refetch,
    notificationsPermission: permission,
    requestNotificationsPermission: requestPermission,
    notificationsSupported: supported,
  };
}
