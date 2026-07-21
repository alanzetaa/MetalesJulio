import { useRef } from "react";
import type { AdminMiembroRow } from "../../lib/database.types";
import type { AdminSortColumn, SortDirection } from "../../utils/adminMembers";
import { capitalizarNombre, formatFechaCorta } from "../../utils/format";
import { isSuspended } from "../../utils/suspension";

interface ColumnDef {
  key: AdminSortColumn | null;
  label: string;
  widthPct: number;
}

const COLUMNS: ColumnDef[] = [
  { key: "nombre", label: "Nombre", widthPct: 11 },
  { key: "dni", label: "DNI", widthPct: 5 },
  { key: "email", label: "Email", widthPct: 14 },
  { key: "ubicacion", label: "Ubicación", widthPct: 14 },
  { key: "created_at", label: "Registro", widthPct: 6 },
  { key: "ultima_conexion", label: "Últ. conexión", widthPct: 6 },
  { key: "suspendido_hasta", label: "Estado", widthPct: 7 },
  { key: "mensajes_recibidos", label: "Mensajes", widthPct: 6 },
  { key: "contactos_recibidos", label: "Contactos", widthPct: 6 },
  { key: null, label: "Acciones", widthPct: 25 },
];

interface MembersTableProps {
  members: AdminMiembroRow[];
  isLoading?: boolean;
  sort: { column: AdminSortColumn; direction: SortDirection };
  onSortChange: (column: AdminSortColumn) => void;
  onSuspender: (id: string, nombre: string) => void;
  onReactivar: (id: string) => void;
  onEliminar: (id: string, nombre: string) => void;
}

export function MembersTable({
  members,
  isLoading,
  sort,
  onSortChange,
  onSuspender,
  onReactivar,
  onEliminar,
}: MembersTableProps) {
  const colRefs = useRef<(HTMLTableColElement | null)[]>([]);

  function handleResizeStart(index: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const colEl = colRefs.current[index];
    if (!colEl) return;
    const startX = e.clientX;
    const startWidth = colEl.getBoundingClientRect().width;
    function onMove(ev: MouseEvent) {
      const newWidth = Math.max(50, startWidth + (ev.clientX - startX));
      colEl!.style.width = `${newWidth}px`;
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <colgroup>
          {COLUMNS.map((col, i) => (
            <col
              key={col.label}
              style={{ width: `${col.widthPct}%` }}
              ref={(el) => {
                colRefs.current[i] = el;
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((col, i) => {
              if (!col.key) return <th key={col.label}>{col.label}</th>;
              const sorted = sort.column === col.key;
              return (
                <th
                  key={col.label}
                  data-sort={col.key}
                  className={sorted ? (sort.direction === "asc" ? "sorted-asc" : "sorted-desc") : ""}
                  onClick={() => onSortChange(col.key as AdminSortColumn)}
                >
                  {col.label}
                  {i < COLUMNS.length - 1 && (
                    <span className="admin-table-resize-handle" onMouseDown={(e) => handleResizeStart(i, e)} />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={10} className="hint" style={{ padding: 20 }}>
                Cargando…
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={10} className="hint" style={{ padding: 20 }}>
                No se encontraron miembros.
              </td>
            </tr>
          ) : (
            members.map((m) => {
              const suspendido = isSuspended(m);
              const nombreCompleto = `${capitalizarNombre(m.nombre)} ${capitalizarNombre(m.apellido)}`;
              return (
                <tr key={m.id}>
                  <td title={nombreCompleto}>{nombreCompleto}</td>
                  <td>{m.dni}</td>
                  <td title={m.email}>{m.email}</td>
                  <td title={m.ubicacion ?? "—"}>{m.ubicacion ?? "—"}</td>
                  <td>{formatFechaCorta(m.created_at)}</td>
                  <td>{formatFechaCorta(m.ultima_conexion)}</td>
                  <td>
                    {suspendido ? (
                      <span className="admin-badge-suspendido">Susp. hasta {formatFechaCorta(m.suspendido_hasta)}</span>
                    ) : (
                      <span className="admin-badge-activo">Activo</span>
                    )}
                  </td>
                  <td>{Number(m.mensajes_recibidos) || 0}</td>
                  <td>{Number(m.contactos_recibidos) || 0}</td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                    <button type="button" className="btn btn-warning" onClick={() => onSuspender(m.id, nombreCompleto)}>
                      Suspender
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => onEliminar(m.id, nombreCompleto)}>
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={!suspendido}
                      onClick={() => onReactivar(m.id)}
                    >
                      Reactivar
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
