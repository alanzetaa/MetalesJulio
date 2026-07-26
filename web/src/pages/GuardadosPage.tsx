import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLightbox } from "../hooks/useLightbox";
import { useLikes, COMUNIDAD_PUBLICACIONES_KEY } from "../hooks/useLikes";
import { useGuardados } from "../hooks/useGuardados";
import { PublicacionCard } from "../components/comunidad/PublicacionCard";
import { ConversationModal } from "../components/mensajes/ConversationModal";
import { Lightbox } from "../components/publicaciones/Lightbox";
import type { ConversationTarget } from "../hooks/useConversationThread";
import { capitalizarNombre } from "../utils/format";
import type { ComunidadPublicacionRow } from "../lib/database.types";

/**
 * Reusa la misma query/cache de "Buscar en la comunidad"
 * (COMUNIDAD_PUBLICACIONES_KEY) -- guardados es solo un filtro sobre la
 * misma lista, no hace falta una consulta aparte a comunidad_publicaciones.
 */
export function GuardadosPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const lightbox = useLightbox();
  const userId = session?.user.id;
  const [conversationTarget, setConversationTarget] = useState<ConversationTarget | null>(null);

  const { data: publicaciones = [], isLoading: isLoadingPublicaciones } = useQuery({
    queryKey: COMUNIDAD_PUBLICACIONES_KEY,
    enabled: Boolean(userId),
    queryFn: async (): Promise<ComunidadPublicacionRow[]> => {
      const { data, error } = await supabase
        .from("comunidad_publicaciones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        showToast(`No se pudo cargar la comunidad: ${error.message}`);
        return [];
      }
      return data ?? [];
    },
  });

  const { misLikedIds, toggleLike } = useLikes(userId);
  const { guardadoIds, toggleGuardado, isLoading: isLoadingGuardados } = useGuardados(userId);

  const guardadas = useMemo(
    () => publicaciones.filter((p) => guardadoIds.has(p.id)),
    [publicaciones, guardadoIds]
  );

  async function handleToggleLike(id: string) {
    const errorMessage = await toggleLike(id);
    if (errorMessage) showToast(`Error: ${errorMessage}`);
  }

  async function handleToggleGuardado(id: string) {
    const errorMessage = await toggleGuardado(id);
    if (errorMessage) showToast(`Error: ${errorMessage}`);
  }

  function handleMessage(item: ComunidadPublicacionRow) {
    setConversationTarget({
      publicacionId: item.id,
      otraId: item.autor_id,
      publicacionTitulo: item.titulo,
      otraNombre: `${capitalizarNombre(item.nombre)} ${capitalizarNombre(item.apellido)}`,
    });
  }

  const isLoading = isLoadingPublicaciones || isLoadingGuardados;

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Guardados</h2>
          <p>Las publicaciones que guardaste para volver a encontrarlas después.</p>
        </div>
        <div className="grid">
          {isLoading ? (
            <div className="empty-state">Cargando…</div>
          ) : guardadas.length === 0 ? (
            <div className="empty-state">
              Todavía no guardaste ninguna publicación.
              <br />
              Tocá el 🔖 en cualquier publicación de "Buscar en la comunidad" para guardarla acá.
            </div>
          ) : (
            guardadas.map((item) => (
              <PublicacionCard
                key={item.id}
                item={item}
                liked={misLikedIds.has(item.id)}
                guardado
                onToggleLike={(id) => void handleToggleLike(id)}
                onToggleGuardado={(id) => void handleToggleGuardado(id)}
                onMessage={handleMessage}
                onOpenFoto={(fotos) => lightbox.open(fotos, 0)}
              />
            ))
          )}
        </div>
      </section>
      <ConversationModal target={conversationTarget} onClose={() => setConversationTarget(null)} />
      <Lightbox
        fotoPaths={lightbox.fotos}
        index={lightbox.index}
        onClose={lightbox.close}
        onIndexChange={lightbox.setIndex}
      />
    </div>
  );
}
