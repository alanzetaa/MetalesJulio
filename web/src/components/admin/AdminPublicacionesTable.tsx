import { useState } from "react";
import type { AdminPublicacionRow } from "../../lib/database.types";
import type { AdminPublicacionSortColumn, SortDirection } from "../../utils/adminMembers";
import { capitalizarNombre, capitalizarOracion, formatFechaCorta } from "../../utils/format";
import { tipoLabel } from "../../utils/publicaciones";
import { VerTextoModal } from "./VerTextoModal";

interface ColumnDef {
  key: AdminPublicacionSortColumn | null;
  label: string;
  widthPct: number;
}

const COLUMNS: ColumnDef[] = [
  { key: "created_at", label: "Fecha", widthPct: 9 },
  { key: "autor_nombre", label: "Autor", widthPct: 15 },
  { key: null, label: "DNI", widthPct: 8 },
  { key: "categoria", label: "Rubro", widthPct: 11 },
  { key: "tipo", label: "Tipo", widthPct: 7 },
  { key: "titulo", label: "Título", widthPct: 15 },
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
  const [verTexto, setVerTexto] = useState<{ titulo: string; texto: string } | null>(null);

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
              return (
                <th
                  key={col.label}
                  data-sort={col.key}
                  className={sorted ? (sort.direction === "asc" ? "sorted-asc" : "sorted-desc") : ""}
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
              <td colSpan={8} className="hint" style={{ padding: 20 }}>
                No se encontraron publicaciones.
              </td>
            </tr>
          ) : (
            publicaciones.map((p) => {
              const autor = `${capitalizarNombre(p.autor_nombre)} ${capitalizarNombre(p.autor_apellido)}`.trim();
              const tituloCap = capitalizarOracion(p.titulo);
              const descripcionCap = capitalizarOracion(p.descripcion);
              return (
                <tr key={p.id}>
                  <td data-label="Fecha">{formatFechaCorta(p.created_at)}</td>
                  <td data-label="Autor" title={`${autor} · ${p.autor_email}`}>{autor}</td>
                  <td data-label="DNI">{p.autor_dni ?? "—"}</td>
                  <td data-label="Rubro">{p.categoria}</td>
                  <td data-label="Tipo">{tipoLabel(p.tipo)}</td>
                  <td data-label="Título" title={tituloCap}>{tituloCap}</td>
                  <td
                    data-label="Descripción"
                    title={descripcionCap}
                    className={descripcionCap ? "admin-table-cell-expandible" : ""}
                    onClick={() => descripcionCap && setVerTexto({ titulo: `Descripción — ${tituloCap}`, texto: descripcionCap })}
                  >
                    {descripcionCap}
                  </td>
                  <td data-label="Acciones">
                    <button type="button" className="btn btn-danger" onClick={() => onEliminar(p.id, tituloCap)}>
                      Eliminar
                    </button>
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
