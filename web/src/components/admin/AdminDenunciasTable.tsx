import { useState } from "react";
import type { AdminDenunciaRow } from "../../lib/database.types";
import { etiquetaMotivo } from "../../constants/denuncias";
import { capitalizarOracion, formatFechaCorta, formatNombreConDni } from "../../utils/format";
import { useExpandableRows } from "../../hooks/useExpandableRows";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "./PaginationControls";
import { VerTextoModal } from "./VerTextoModal";

interface AdminDenunciasTableProps {
  denuncias: AdminDenunciaRow[];
  onEnviarMensaje: (denuncia: AdminDenunciaRow) => void;
}

export function AdminDenunciasTable({ denuncias, onEnviarMensaje }: AdminDenunciasTableProps) {
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);
  const { toggle, isExpanded } = useExpandableRows();
  const { pageItems, page, totalPages, nextPage, prevPage } = usePagination(denuncias);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Denunciante</th>
            <th>Celular</th>
            <th>Denunciado</th>
            <th>Publicación</th>
            <th>Motivo</th>
            <th>Comentario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {denuncias.length === 0 ? (
            <tr>
              <td colSpan={8} className="hint" style={{ padding: 20 }}>
                No hay denuncias registradas.
              </td>
            </tr>
          ) : (
            pageItems.map((d) => {
              const denunciante = formatNombreConDni(d.denunciante_nombre, d.denunciante_apellido, d.denunciante_dni);
              const denunciado = formatNombreConDni(d.denunciado_nombre, d.denunciado_apellido, d.denunciado_dni);
              const expanded = isExpanded(d.id);
              return (
                <tr key={d.id} className={expanded ? "expanded" : undefined}>
                  <td className="admin-table-summary" onClick={() => toggle(d.id)}>
                    <span>
                      {denunciante} → {denunciado}
                    </span>
                    <span className="admin-table-chevron">▾</span>
                  </td>
                  <td className="admin-table-detail" data-label="Fecha">{formatFechaCorta(d.created_at)}</td>
                  <td className="admin-table-detail" data-label="Denunciante" title={denunciante}>{denunciante}</td>
                  <td className="admin-table-detail" data-label="Celular">{d.denunciante_whatsapp ?? "—"}</td>
                  <td className="admin-table-detail" data-label="Denunciado" title={denunciado}>{denunciado}</td>
                  <td className="admin-table-detail" data-label="Publicación" title={capitalizarOracion(d.publicacion_titulo)}>{capitalizarOracion(d.publicacion_titulo)}</td>
                  <td className="admin-table-detail" data-label="Motivo">{etiquetaMotivo(d.motivo)}</td>
                  <td
                    className={"admin-table-detail" + (d.comentario ? " admin-table-cell-expandible" : "")}
                    data-label="Comentario"
                    title={d.comentario ?? ""}
                    onClick={() => d.comentario && setVerTexto({ titulo: "Comentario de la denuncia", texto: d.comentario })}
                  >
                    {d.comentario ?? "—"}
                  </td>
                  <td className="admin-table-detail" data-label="Acciones">
                    <button type="button" className="btn btn-outline-dark" onClick={() => onEnviarMensaje(d)}>
                      Mensaje
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <PaginationControls page={page} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} />
      <VerTextoModal info={verTexto} onClose={() => setVerTexto(null)} />
    </div>
  );
}
