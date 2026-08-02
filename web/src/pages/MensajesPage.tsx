import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { agruparConversaciones, matchesConversacionSearch, type Conversacion } from "../utils/conversations";
import { formatFechaCorta, iniciales } from "../utils/format";
import { ConversationModal } from "../components/mensajes/ConversationModal";
import type { ConversationTarget } from "../hooks/useConversationThread";

export function MensajesPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [conversationTarget, setConversationTarget] = useState<ConversationTarget | null>(null);
  const [search, setSearch] = useState("");

  const { data: conversaciones = [], isLoading } = useQuery({
    queryKey: ["conversaciones", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Conversacion[]> => {
      const { data } = await supabase.from("mensajes_detalle").select("*").order("created_at", { ascending: false });
      return agruparConversaciones(data ?? [], userId as string);
    },
  });

  const conversacionesFiltradas = conversaciones.filter((c) => matchesConversacionSearch(c, search));

  function abrirConversacion(c: Conversacion) {
    setConversationTarget({
      publicacionId: c.publicacionId,
      otraId: c.otraId,
      publicacionTitulo: c.publicacionTitulo,
      otraNombre: c.otraNombre,
    });
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Mensajes</h2>
          <p>Tus conversaciones con otros miembros de la comunidad, agrupadas por publicación.</p>
        </div>
        {conversaciones.length > 0 && (
          <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Buscar por nombre, publicación o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        <div className="conv-list">
          {isLoading ? (
            <div className="empty-state">Cargando…</div>
          ) : conversaciones.length === 0 ? (
            <div className="empty-state">
              Todavía no tenés conversaciones.
              <br />
              Escribile a alguien desde una publicación en "Buscar en la comunidad".
            </div>
          ) : conversacionesFiltradas.length === 0 ? (
            <div className="empty-state">No encontramos conversaciones que coincidan con "{search}".</div>
          ) : (
            conversacionesFiltradas.map((c) => {
              const esMio = c.ultimoMensaje.remitente_id === userId;
              const snippet = (esMio ? "Vos: " : "") + c.ultimoMensaje.cuerpo;
              return (
                <button
                  type="button"
                  key={`${c.publicacionId}|${c.otraId}`}
                  className={"conv-item" + (c.noLeidos ? " unread" : "")}
                  onClick={() => abrirConversacion(c)}
                >
                  <div className="conv-item-avatar-row">
                    <span className="conv-avatar">{iniciales(c.otraNombre)}</span>
                    <div className="conv-item-main">
                      <p className="conv-item-title">
                        {c.otraNombre} · {c.publicacionTitulo}
                      </p>
                      <p className="conv-item-sub">{snippet}</p>
                    </div>
                  </div>
                  <div className="conv-item-meta">
                    {c.noLeidos > 0 && <span className="nav-badge">{c.noLeidos}</span>}
                    <span className="conv-item-fecha">{formatFechaCorta(c.ultimoMensaje.created_at)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>
      <ConversationModal target={conversationTarget} onClose={() => setConversationTarget(null)} />
    </div>
  );
}
