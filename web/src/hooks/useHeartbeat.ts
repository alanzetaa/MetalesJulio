import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const HEARTBEAT_MS = 60_000;

/**
 * "Latido" para que HQ Metales pueda ver quién está usando la plataforma
 * ahora mismo (ver reglas.md, "En línea ahora") -- pisa
 * profiles.ultima_actividad cada 60s mientras haya sesión, sin Realtime (a
 * propósito, mismo criterio que useUnreadCount). Si la persona todavía no
 * completó su perfil, el update no afecta ninguna fila (no hay error) y
 * simplemente no cuenta como "en línea" hasta que lo complete.
 */
export function useHeartbeat() {
  const { session } = useAuth();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    function latir() {
      void supabase.from("profiles").update({ ultima_actividad: new Date().toISOString() }).eq("id", userId as string);
    }

    latir();
    const id = setInterval(latir, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [userId]);
}
