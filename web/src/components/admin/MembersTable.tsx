import { useRef } from "react";
import type { AdminMiembroRow } from "../../lib/database.types";
import type { AdminSortColumn, SortDirection } from "../../utils/adminMembers";
import { capitalizarNombre, formatFechaCorta } from "../../utils/format";
import { isSuspended } from "../../utils/suspension";
import { TERMINOS_VERSION_ACTUAL } from "../../constants/terminos";
import { useExpandableRows } from "../../hooks/useExpandableRows";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "./PaginationControls";

interface ColumnDef {
  key: AdminSortColumn | null;
  label: string;
  widthPct: number;
  center?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "nombre", label: "Nombre", widthPct: 12 },
  { key: "dni", label: "DNI", widthPct: 6 },
  { key: "email", label: "Email", widthPct: 9 },
  { key: "ubicacion", label: "Ubicación", widthPct: 8 },
  { key: "ciudad", label: "Ciudad", widthPct: 8 },
  { key: "created_at", label: "Registro", widthPct: 5 },
  { key: "ultima_conexion", label: "Últ. conexión", widthPct: 5 },
  { key: "suspendido_hasta", label: "Estado", widthPct: 6 },
  { key: "terminos_version_aceptada", label: "Términos", widthPct: 6 },
  { key: "mensajes_recibidos", label: "Mensajes", widthPct: 9, center: true },
  { key: null, label: "Acciones", widthPct: 26 },
];

interface MembersTableProps {
  members: AdminMiembroRow[];
  isLoading?: boolean;
  sort: { column: AdminSortColumn; direction: SortDirection };
  onSortChange: (column: AdminSortColumn) => void;
  onSuspender: (id: string, nombre: string) => void;
  onReactivar: (id: string) => void;
  onEliminar: (id: string, nombre: string) => void;
  onVerComo: (id: string, nombre: string) => void;
  /** Para deshabilitar "Entrar como" en la propia fila -- no tiene sentido entrar como uno mismo */
  currentUserId?: string;
}

export function MembersTable({
  members,
  isLoading,
  sort,
  onSortChange,
  onSuspender,
  onReactivar,
  onEliminar,
  onVerComo,
  currentUserId,
}: MembersTableProps) {
  const colRefs = useRef<(HTMLTableColElement | null)[]>([]);
  const { toggle, isExpanded } = useExpandableRows();
  const { pageItems, page, totalPages, nextPage, prevPage } = usePagination(members);

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
              const sortClass = sorted ? (sort.direction === "asc" ? "sorted-asc" : "sorted-desc") : "";
              return (
                <th
                  key={col.label}
                  data-sort={col.key}
                  className={[sortClass, col.center ? "admin-table-cell-center" : ""].filter(Boolean).join(" ")}
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
              <td colSpan={11} className="hint" style={{ padding: 20 }}>
                Cargando…
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={11} className="hint" style={{ padding: 20 }}>
                No se encontraron miembros.
              </td>
            </tr>
          ) : (
            pageItems.map((m) => {
              const suspendido = isSuspended(m);
              const nombreCompleto = `${capitalizarNombre(m.nombre)} ${capitalizarNombre(m.apellido)}`;
              const expanded = isExpanded(m.id);
              return (
                <tr key={m.id} className={expanded ? "expanded" : undefined}>
                  <td className="admin-table-summary" onClick={() => toggle(m.id)}>
                    <span>
                      {nombreCompleto} · DNI {m.dni}
                    </span>
                    <span className="admin-table-chevron">▾</span>
                  </td>
                  <td className="admin-table-detail" data-label="Nombre" title={nombreCompleto}>{nombreCompleto}</td>
                  <td className="admin-table-detail" data-label="DNI">{m.dni}</td>
                  <td className="admin-table-detail" data-label="Email" title={m.email}>{m.email}</td>
                  <td className="admin-table-detail" data-label="Ubicación" title={m.ubicacion ?? "—"}>{m.ubicacion ?? "—"}</td>
                  <td className="admin-table-detail" data-label="Ciudad" title={m.ciudad ?? "—"}>{m.ciudad ?? "—"}</td>
                  <td className="admin-table-detail" data-label="Registro">{formatFechaCorta(m.created_at)}</td>
                  <td className="admin-table-detail" data-label="Últ. conexión">{formatFechaCorta(m.ultima_conexion)}</td>
                  <td className="admin-table-detail" data-label="Estado">
                    {suspendido ? (
                      <span className="admin-badge-suspendido">Susp. hasta {formatFechaCorta(m.suspendido_hasta)}</span>
                    ) : (
                      <span className="admin-badge-activo">Activo</span>
                    )}
                  </td>
                  <td className="admin-table-detail" data-label="Términos">
                    {m.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL ? (
                      <span className="admin-badge-activo">✓ Aceptó</span>
                    ) : (
                      <span className="admin-badge-suspendido">Pendiente</span>
                    )}
                  </td>
                  <td className="admin-table-detail admin-table-cell-center" data-label="Mensajes">{Number(m.mensajes_recibidos) || 0}</td>
                  <td className="admin-table-detail admin-table-cell-actions" data-label="Acciones" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      disabled={m.id === currentUserId}
                      title={m.id === currentUserId ? "No podés entrar como vos mismo" : "Entrar a esta cuenta para verificar un problema"}
                      onClick={() => onVerComo(m.id, nombreCompleto)}
                    >
                      Entrar
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <PaginationControls page={page} totalPages={totalPages} onPrev={prevPage} onNext={nextPage} />
    </div>
  );
}
