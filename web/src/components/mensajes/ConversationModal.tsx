import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useConversationThread, type ConversationTarget } from "../../hooks/useConversationThread";
import { formatFecha, iniciales } from "../../utils/format";

interface ConversationModalProps {
  target: ConversationTarget | null;
  onClose: () => void;
}

export function ConversationModal({ target, onClose }: ConversationModalProps) {
  const { session } = useAuth();
  const { messages, isLoading, sendMessage } = useConversationThread(target);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setBody("");
  }, [target?.publicacionId, target?.otraId]);

  if (!target) return null;

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cuerpo = body.trim();
    if (!cuerpo) return;
    setSending(true);
    const { error } = await sendMessage(cuerpo);
    setSending(false);
    if (!error) setBody("");
  }

  return (
    <div className="modal-overlay open" onMouseDown={handleOverlayClick}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="conv-avatar">{iniciales(target.otraNombre)}</span>
            <div>
              <h3>{target.otraNombre}</h3>
              <p className="hint" style={{ margin: "2px 0 0" }}>
                Sobre: {target.publicacionTitulo}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="msg-thread" ref={threadRef}>
            {isLoading ? (
              <div className="hint">Cargando…</div>
            ) : messages.length === 0 ? (
              <div className="hint">Todavía no hay mensajes en esta conversación. ¡Escribí el primero!</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={"msg-bubble " + (m.remitente_id === session?.user.id ? "msg-bubble-mine" : "msg-bubble-other")}
                >
                  {m.cuerpo}
                  <span className="msg-bubble-fecha">{formatFecha(m.created_at)}</span>
                </div>
              ))
            )}
          </div>
          <form className="msg-compose" onSubmit={(e) => void handleSubmit(e)}>
            <textarea
              rows={2}
              placeholder="Escribí tu mensaje..."
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <button type="submit" className="btn btn-dark" disabled={sending}>
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
