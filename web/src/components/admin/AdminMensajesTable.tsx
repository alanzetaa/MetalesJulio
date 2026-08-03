import { useState } from "react";
import type { AdminMensajeRow } from "../../lib/database.types";
import { capitalizarNombre, capitalizarOracion, formatFechaCorta } from "../../utils/format";
import { VerTextoModal } from "./VerTextoModal";

export function AdminMensajesTable({ mensajes }: { mensajes: AdminMensajeRow[] }) {
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "44%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>De</th>
            <th>Para</th>
            <th>Publicación</th>
            <th>Mensaje</th>
          </tr>
        </thead>
        <tbody>
          {mensajes.length === 0 ? (
            <tr>
              <td colSpan={5} className="hint" style={{ padding: 20 }}>
                Todavía no hay mensajes en la comunidad.
              </td>
            </tr>
          ) : (
            mensajes.map((m) => {
              const de = `${capitalizarNombre(m.remitente_nombre)} ${capitalizarNombre(m.remitente_apellido)}`;
              const para = `${capitalizarNombre(m.destinatario_nombre)} ${capitalizarNombre(m.destinatario_apellido)}`;
              return (
                <tr key={m.id}>
                  <td>{formatFechaCorta(m.created_at)}</td>
                  <td title={de}>{de}</td>
                  <td title={para}>{para}</td>
                  <td title={capitalizarOracion(m.publicacion_titulo)}>{capitalizarOracion(m.publicacion_titulo)}</td>
                  <td
                    title={m.cuerpo}
                    className={m.cuerpo ? "admin-table-cell-expandible" : ""}
                    onClick={() => m.cuerpo && setVerTexto({ titulo: `Mensaje de ${de}`, texto: m.cuerpo })}
                  >
                    {m.cuerpo}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <VerTextoModal info={verTexto} onClose={() => setVerTexto(null)} />
    </div>
  );
}
