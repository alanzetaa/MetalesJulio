import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLightbox } from "../hooks/useLightbox";
import { useLikes } from "../hooks/useLikes";
import { useGuardados } from "../hooks/useGuardados";
import { PublicacionCard } from "../components/comunidad/PublicacionCard";
import { ConversationModal } from "../components/mensajes/ConversationModal";
import { Lightbox } from "../components/publicaciones/Lightbox";
import type { ConversationTarget } from "../hooks/useConversationThread";
import { capitalizarNombre, formatFechaCorta, iniciales } from "../utils/format";
import type { ComunidadPublicacionRow, PerfilPublicoRow, ResenaDetalleRow } from "../lib/database.types";

export function PerfilPublicoPage() {
  const { userId } = useParams<{ userId: string }>();
  const { session } = useAuth();
  const { showToast } = useToast();
  const lightbox = useLightbox();
  const [conversationTarget, setConversationTarget] = useState<ConversationTarget | null>(null);

  const { misLikedIds, toggleLike } = useLikes(session?.user.id);
  const { guardadoIds, toggleGuardado } = useGuardados(session?.user.id);

  const { data: perfil, isLoading: isLoadingPerfil } = useQuery({
    queryKey: ["perfilPublico", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PerfilPublicoRow | null> => {
      const { data } = await supabase.from("perfil_publico").select("*").eq("id", userId as string).maybeSingle();
      return data;
    },
  });

  const { data: publicaciones = [], isLoading: isLoadingPublicaciones } = useQuery({
    queryKey: ["publicacionesDe", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ComunidadPublicacionRow[]> => {
      const { data } = await supabase
        .from("comunidad_publicaciones")
        .select("*")
        .eq("autor_id", userId as string)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: resenas = [], isLoading: isLoadingResenas } = useQuery({
    queryKey: ["resenasDe", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ResenaDetalleRow[]> => {
      const { data } = await supabase
        .from("resenas_detalle")
        .select("*")
        .eq("destinatario_id", userId as string)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Ver el propio perfil público no tiene mucho sentido (ya tenés "Mis
  // publicaciones" y "Mi perfil" para eso) -- mandamos directo a editarlo.
  if (session && userId === session.user.id) {
    return <Navigate to="/perfil" replace />;
  }

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

  const isLoading = isLoadingPerfil || isLoadingPublicaciones || isLoadingResenas;

  if (isLoading) {
    return (
      <div className="app-content-inner">
        <div className="empty-state">Cargando…</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="app-content-inner">
        <div className="empty-state">No encontramos este perfil.</div>
      </div>
    );
  }

  const nombreCompleto = `${capitalizarNombre(perfil.nombre)} ${capitalizarNombre(perfil.apellido)}`;

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className="conv-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
              {iniciales(nombreCompleto)}
            </span>
            <div>
              <h2 style={{ margin: 0 }}>{nombreCompleto}</h2>
              <p className="hint" style={{ margin: "2px 0 0" }}>
                {perfil.provincia ?? "Ubicación no especificada"}
                {perfil.resenas_cantidad > 0 && (
                  <>
                    {" · "}⭐ {perfil.resenas_promedio} ({perfil.resenas_cantidad}{" "}
                    {perfil.resenas_cantidad === 1 ? "reseña" : "reseñas"})
                  </>
                )}
              </p>
            </div>
          </div>
          {perfil.descripcion && <p style={{ marginTop: 14 }}>{perfil.descripcion}</p>}
        </div>

        <h3 style={{ marginBottom: 14 }}>Publicaciones</h3>
        <div className="grid">
          {publicaciones.length === 0 ? (
            <div className="empty-state">Todavía no publicó nada.</div>
          ) : (
            publicaciones.map((item) => (
              <PublicacionCard
                key={item.id}
                item={item}
                liked={misLikedIds.has(item.id)}
                guardado={guardadoIds.has(item.id)}
                onToggleLike={(id) => void handleToggleLike(id)}
                onToggleGuardado={(id) => void handleToggleGuardado(id)}
                onMessage={handleMessage}
                onOpenFoto={(fotos) => lightbox.open(fotos, 0)}
              />
            ))
          )}
        </div>

        {resenas.length > 0 && (
          <>
            <h3 style={{ margin: "28px 0 14px" }}>Reseñas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {resenas.map((r) => (
                <div key={r.id} className="card">
                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                    {"⭐".repeat(r.puntaje)}
                    <span className="hint" style={{ marginLeft: 8 }}>
                      {capitalizarNombre(r.autor_nombre)} {capitalizarNombre(r.autor_apellido)} ·{" "}
                      {formatFechaCorta(r.created_at)}
                    </span>
                  </p>
                  {r.comentario && <p style={{ margin: 0 }}>{r.comentario}</p>}
                  <p className="hint" style={{ margin: "4px 0 0" }}>
                    Sobre: {r.publicacion_titulo}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
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
