import type { AdminMensajeRow } from "../../lib/database.types";
import { formatFecha } from "../../utils/format";
import { Modal } from "../ui/Modal";

export interface AdminHiloTarget {
  publicacionId: string;
  publicacionTitulo: string;
  personaAId: string;
  personaANombre: string;
  personaBId: string;
  personaBNombre: string;
}

interface AdminHiloModalProps {
  target: AdminHiloTarget | null;
  mensajes: AdminMensajeRow[];
  onClose: () => void;
}

/**
 * Hilo completo de una conversación entre dos personas, visto desde HQ
 * Metales (solo lectura, sin caja para responder) -- se arma filtrando en
 * el cliente sobre los mensajes ya cargados para la tabla "Mensajes de la
 * comunidad", sin pedir nada nuevo a la base.
 */
export function AdminHiloModal({ target, mensajes, onClose }: AdminHiloModalProps) {
  if (!target) return null;

  const hilo = mensajes
    .filter(
      (m) =>
        m.publicacion_id === target.publicacionId &&
        ((m.remitente_id === target.personaAId && m.destinatario_id === target.personaBId) ||
          (m.remitente_id === target.personaBId && m.destinatario_id === target.personaAId))
    )
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={460}
      title={
        <>
          {target.personaANombre} ↔ {target.personaBNombre}
          <p className="hint" style={{ margin: "2px 0 0", fontWeight: 400 }}>
            Sobre: {target.publicacionTitulo}
          </p>
        </>
      }
    >
      <div className="msg-thread">
        {hilo.length === 0 ? (
          <div className="hint">No se encontraron mensajes de esta conversación.</div>
        ) : (
          hilo.map((m) => (
            <div
              key={m.id}
              className={"msg-bubble " + (m.remitente_id === target.personaAId ? "msg-bubble-mine" : "msg-bubble-other")}
            >
              <strong style={{ display: "block", fontSize: 11, opacity: 0.75, marginBottom: 2 }}>
                {m.remitente_id === target.personaAId ? target.personaANombre : target.personaBNombre}
              </strong>
              {m.cuerpo}
              <span className="msg-bubble-fecha">{formatFecha(m.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
