import { useState } from "react";
import type { AdminMensajeRow } from "../../lib/database.types";
import { capitalizarNombre, capitalizarOracion, formatFechaCorta, formatHora } from "../../utils/format";
import { useExpandableRows } from "../../hooks/useExpandableRows";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "./PaginationControls";
import { VerTextoModal } from "./VerTextoModal";
import { AdminHiloModal, type AdminHiloTarget } from "./AdminHiloModal";

interface AdminMensajesTableProps {
  mensajes: AdminMensajeRow[];
  /** Lista completa (sin el filtro del buscador) para armar el hilo entero de una conversación. */
  todosLosMensajes: AdminMensajeRow[];
}

export function AdminMensajesTable({ mensajes, todosLosMensajes }: AdminMensajesTableProps) {
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);
  const [hilo, setHilo] = useState<AdminHiloTarget | null>(null);
  const { toggle, isExpanded } = useExpandableRows();
  const { pageItems, page, totalPages, nextPage, prevPage } = usePagination(mensajes);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "38%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>De</th>
            <th>Para</th>
            <th>Publicación</th>
            <th>Mensaje</th>
          </tr>
        </thead>
        <tbody>
          {mensajes.length === 0 ? (
            <tr>
              <td colSpan={6} className="hint" style={{ padding: 20 }}>
                Todavía no hay mensajes en la comunidad.
              </td>
            </tr>
          ) : (
            pageItems.map((m) => {
              const de = `${capitalizarNombre(m.remitente_nombre)} ${capitalizarNombre(m.remitente_apellido)}`;
              const para = `${capitalizarNombre(m.destinatario_nombre)} ${capitalizarNombre(m.destinatario_apellido)}`;
              const expanded = isExpanded(m.id);
              return (
                <tr key={m.id} className={expanded ? "expanded" : undefined}>
                  <td className="admin-table-summary" onClick={() => toggle(m.id)}>
                    <span>
                      {de} → {para}
                    </span>
                    <span className="admin-table-chevron">▾</span>
                  </td>
                  <td className="admin-table-detail" data-label="Fecha">{formatFechaCorta(m.created_at)}</td>
                  <td className="admin-table-detail" data-label="Hora">{formatHora(m.created_at)}</td>
                  <td className="admin-table-detail" data-label="De" title={de}>{de}</td>
                  <td className="admin-table-detail" data-label="Para" title={para}>{para}</td>
                  <td
                    className="admin-table-detail admin-table-cell-expandible"
                    data-label="Publicación"
                    title={`Ver charla — ${capitalizarOracion(m.publicacion_titulo)}`}
                    onClick={() =>
                      setHilo({
                        publicacionId: m.publicacion_id,
                        publicacionTitulo: capitalizarOracion(m.publicacion_titulo),
                        personaAId: m.remitente_id,
                        personaANombre: de,
                        personaBId: m.destinatario_id,
                        personaBNombre: para,
                      })
                    }
                  >
                    {capitalizarOracion(m.publicacion_titulo)}
                    {m.publicacion_eliminada_at && (
                      <span className="admin-badge-suspendido" style={{ marginLeft: 6 }}>
                        Eliminada
                      </span>
                    )}
                  </td>
                  <td
                    className={"admin-table-detail" + (m.cuerpo ? " admin-table-cell-expandible" : "")}
                    data-label="Mensaje"
                    title={m.cuerpo}
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
      <PaginationControls page={page} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} />
      <VerTextoModal info={verTexto} onClose={() => setVerTexto(null)} />
      <AdminHiloModal target={hilo} mensajes={todosLosMensajes} onClose={() => setHilo(null)} />
    </div>
  );
}
