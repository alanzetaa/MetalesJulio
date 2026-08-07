import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdminPublicacionRow } from "../../lib/database.types";
import type { AdminPublicacionSortColumn, SortDirection } from "../../utils/adminMembers";
import { capitalizarNombre, capitalizarOracion, formatFechaCorta } from "../../utils/format";
import { tipoLabel } from "../../utils/publicaciones";
import { useExpandableRows } from "../../hooks/useExpandableRows";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "./PaginationControls";
import { VerTextoModal } from "./VerTextoModal";

interface ColumnDef {
  key: AdminPublicacionSortColumn | null;
  label: string;
  widthPct: number;
  center?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "created_at", label: "Fecha", widthPct: 8 },
  { key: "autor_nombre", label: "Autor", widthPct: 14 },
  { key: null, label: "DNI", widthPct: 7 },
  { key: "categoria", label: "Rubro", widthPct: 10 },
  { key: "tipo", label: "Tipo", widthPct: 6 },
  { key: "titulo", label: "Título", widthPct: 13 },
  { key: "likes_count", label: "Me gusta", widthPct: 7, center: true },
  { key: null, label: "Descripción", widthPct: 23 },
  { key: null, label: "Acciones", widthPct: 12 },
];

interface AdminPublicacionesTableProps {
  publicaciones: AdminPublicacionRow[];
  sort: { column: AdminPublicacionSortColumn; direction: SortDirection };
  onSortChange: (column: AdminPublicacionSortColumn) => void;
  onEliminar: (id: string, titulo: string) => void;
}

export function AdminPublicacionesTable({ publicaciones, sort, onSortChange, onEliminar }: AdminPublicacionesTableProps) {
  const navigate = useNavigate();
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);
  const { toggle, isExpanded } = useExpandableRows();
  const { pageItems, page, totalPages, nextPage, prevPage } = usePagination(publicaciones);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.label} style={{ width: `${col.widthPct}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              if (!col.key) return <th key={col.label}>{col.label}</th>;
              const sorted = sort.column === col.key;
              const sortClass = sorted ? (sort.direction === "asc" ? "sorted-asc" : "sorted-desc") : "";
              return (
                <th
                  key={col.label}
                  data-sort={col.key}
                  className={[sortClass, col.center ? "admin-table-cell-center" : ""].filter(Boolean).join(" ")}
                  onClick={() => onSortChange(col.key as AdminPublicacionSortColumn)}
                >
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {publicaciones.length === 0 ? (
            <tr>
              <td colSpan={9} className="hint" style={{ padding: 20 }}>
                No se encontraron publicaciones.
              </td>
            </tr>
          ) : (
            pageItems.map((p) => {
              const autor = `${capitalizarNombre(p.autor_nombre)} ${capitalizarNombre(p.autor_apellido)}`.trim();
              const tituloCap = capitalizarOracion(p.titulo);
              const descripcionCap = capitalizarOracion(p.descripcion);
              const expanded = isExpanded(p.id);
              const eliminada = Boolean(p.deleted_at);
              return (
                <tr key={p.id} className={expanded ? "expanded" : undefined}>
                  <td className="admin-table-summary" onClick={() => toggle(p.id)}>
                    <span>
                      {autor} · {tituloCap}
                      {eliminada && <span className="admin-badge-suspendido" style={{ marginLeft: 6 }}>Eliminada</span>}
                    </span>
                    <span className="admin-table-chevron">▾</span>
                  </td>
                  <td className="admin-table-detail" data-label="Fecha">{formatFechaCorta(p.created_at)}</td>
                  <td className="admin-table-detail" data-label="Autor" title={`${autor} · ${p.autor_email}`}>{autor}</td>
                  <td className="admin-table-detail" data-label="DNI">{p.autor_dni ?? "—"}</td>
                  <td className="admin-table-detail" data-label="Rubro">{p.categoria}</td>
                  <td className="admin-table-detail" data-label="Tipo">{tipoLabel(p.tipo)}</td>
                  <td
                    className={"admin-table-detail" + (eliminada ? "" : " admin-table-cell-expandible")}
                    data-label="Título"
                    title={eliminada ? tituloCap : `Ver publicación — ${tituloCap}`}
                    onClick={() => !eliminada && navigate(`/perfil/${p.autor_id}#pub-${p.id}`)}
                  >
                    {tituloCap}
                    {eliminada && (
                      <span
                        className="admin-badge-suspendido"
                        style={{ marginLeft: 6 }}
                        title={`Eliminada el ${formatFechaCorta(p.deleted_at)}`}
                      >
                        Eliminada
                      </span>
                    )}
                  </td>
                  <td className="admin-table-detail admin-table-cell-center" data-label="Me gusta">{Number(p.likes_count) || 0}</td>
                  <td
                    className={"admin-table-detail" + (descripcionCap ? " admin-table-cell-expandible" : "")}
                    data-label="Descripción"
                    title={descripcionCap}
                    onClick={() => descripcionCap && setVerTexto({ titulo: `Descripción — ${tituloCap}`, texto: descripcionCap })}
                  >
                    {descripcionCap}
                  </td>
                  <td className="admin-table-detail admin-table-cell-actions" data-label="Acciones">
                    <button
                      type="button"
                      className="btn btn-danger"
                      title={eliminada ? "Ya está marcada como eliminada; esto la borra de la base para siempre" : undefined}
                      onClick={() => onEliminar(p.id, tituloCap)}
                    >
                      {eliminada ? "Borrar para siempre" : "Eliminar"}
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
