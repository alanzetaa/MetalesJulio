import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { agruparConversaciones, matchesConversacionSearch, type Conversacion } from "../utils/conversations";
import { formatFechaCorta, formatHora, iniciales } from "../utils/format";
import { ConversationModal } from "../components/mensajes/ConversationModal";
import { ReportSection } from "../components/mensajes/ReportSection";
import { Modal } from "../components/ui/Modal";
import type { ConversationTarget } from "../hooks/useConversationThread";

type FiltroPropiedad = "todos" | "mias" | "otras";

export function MensajesPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [conversationTarget, setConversationTarget] = useState<ConversationTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<ConversationTarget | null>(null);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<FiltroPropiedad>("todos");

  const { data: conversaciones = [], isLoading } = useQuery({
    queryKey: ["conversaciones", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Conversacion[]> => {
      const { data } = await supabase.from("mensajes_detalle").select("*").order("created_at", { ascending: false });
      return agruparConversaciones(data ?? [], userId as string);
    },
  });

  const conversacionesFiltradas = conversaciones
    .filter((c) => filtro === "todos" || (filtro === "mias" ? c.publicacionEsMia : !c.publicacionEsMia))
    .filter((c) => matchesConversacionSearch(c, search));

  function targetDe(c: Conversacion): ConversationTarget {
    return {
      publicacionId: c.publicacionId,
      otraId: c.otraId,
      publicacionTitulo: c.publicacionTitulo,
      otraNombre: c.otraNombre,
    };
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>Mensajes</h2>
          <p>Tus conversaciones con otros miembros de la comunidad, agrupadas por publicación.</p>
        </div>
        {conversaciones.length > 0 && (
          <>
            <div className="msg-filtro-toggle" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className={"msg-filtro-btn msg-filtro-btn-todos" + (filtro === "todos" ? " active" : "")}
                onClick={() => setFiltro("todos")}
              >
                Todos
              </button>
              <button
                type="button"
                className={"msg-filtro-btn msg-filtro-btn-mias" + (filtro === "mias" ? " active" : "")}
                onClick={() => setFiltro("mias")}
              >
                Mis publicaciones
              </button>
              <button
                type="button"
                className={"msg-filtro-btn msg-filtro-btn-otras" + (filtro === "otras" ? " active" : "")}
                onClick={() => setFiltro("otras")}
              >
                Otras publicaciones
              </button>
            </div>
            <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Buscar por nombre, publicación o mensaje..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </>
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
            <div className="empty-state">
              {search
                ? `No encontramos conversaciones que coincidan con "${search}".`
                : "No tenés conversaciones de este tipo."}
            </div>
          ) : (
            conversacionesFiltradas.map((c) => {
              const esMio = c.ultimoMensaje.remitente_id === userId;
              const snippet = (esMio ? "Vos: " : "") + c.ultimoMensaje.cuerpo;
              return (
                <div key={`${c.publicacionId}|${c.otraId}`} className={"conv-item" + (c.noLeidos ? " unread" : "")}>
                  <button type="button" className="conv-item-open" onClick={() => setConversationTarget(targetDe(c))}>
                    <div className="conv-item-avatar-row">
                      <span
                        className="conv-avatar"
                        title={c.publicacionEsMia ? "Publicación tuya" : "Publicación de otra persona"}
                        style={{ background: c.publicacionEsMia ? "var(--color-accent)" : "#0e7490" }}
                      >
                        {iniciales(c.otraNombre)}
                      </span>
                      <div className="conv-item-main">
                        <p className="conv-item-title">
                          {c.otraNombre} · <span className="conv-item-pub-titulo">{c.publicacionTitulo}</span>
                        </p>
                        <p className="conv-item-sub">{snippet}</p>
                      </div>
                    </div>
                  </button>
                  <div className="conv-item-meta">
                    {c.noLeidos > 0 && <span className="nav-badge">{c.noLeidos}</span>}
                    <span className="conv-item-fecha">
                      {formatFechaCorta(c.ultimoMensaje.created_at)}
                      <br />
                      {formatHora(c.ultimoMensaje.created_at)}
                    </span>
                    <button
                      type="button"
                      className="conv-item-report-btn"
                      title={`Denunciar a ${c.otraNombre}`}
                      onClick={() => setReportTarget(targetDe(c))}
                    >
                      🚩
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      <ConversationModal target={conversationTarget} onClose={() => setConversationTarget(null)} />
      <Modal open={Boolean(reportTarget)} onClose={() => setReportTarget(null)} title="Denunciar" maxWidth={420}>
        {reportTarget && <ReportSection target={reportTarget} />}
      </Modal>
    </div>
  );
}
