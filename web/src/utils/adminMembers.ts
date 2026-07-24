import type { AdminMensajeRow, AdminMiembroRow, AdminPublicacionRow } from "../lib/database.types";

export type AdminSortColumn =
  | "nombre"
  | "dni"
  | "email"
  | "ubicacion"
  | "created_at"
  | "ultima_conexion"
  | "suspendido_hasta"
  | "mensajes_recibidos"
  | "contactos_recibidos";

export type SortDirection = "asc" | "desc";

export function matchesAdminSearch(m: AdminMiembroRow, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const haystack = [m.nombre, m.apellido, m.dni, m.email, m.ubicacion].filter(Boolean).join(" ").toLowerCase();
  return haystack.indexOf(t) !== -1;
}

const DATE_COLUMNS: readonly AdminSortColumn[] = ["created_at", "ultima_conexion", "suspendido_hasta"];
const NUMERIC_COLUMNS: readonly AdminSortColumn[] = ["mensajes_recibidos", "contactos_recibidos"];

export function compareAdminRows(
  a: AdminMiembroRow,
  b: AdminMiembroRow,
  column: AdminSortColumn,
  direction: SortDirection
): number {
  let result: number;
  if (DATE_COLUMNS.includes(column)) {
    const at = a[column] ? new Date(a[column] as string).getTime() : 0;
    const bt = b[column] ? new Date(b[column] as string).getTime() : 0;
    result = at - bt;
  } else if (NUMERIC_COLUMNS.includes(column)) {
    result = (Number(a[column]) || 0) - (Number(b[column]) || 0);
  } else if (column === "nombre") {
    const av = `${a.nombre} ${a.apellido}`.toLowerCase();
    const bv = `${b.nombre} ${b.apellido}`.toLowerCase();
    result = av < bv ? -1 : av > bv ? 1 : 0;
  } else {
    const av = String(a[column] ?? "").toLowerCase();
    const bv = String(b[column] ?? "").toLowerCase();
    result = av < bv ? -1 : av > bv ? 1 : 0;
  }
  return direction === "asc" ? result : -result;
}

/** Buscador de "Publicaciones de la comunidad" en HQ Metales -- por usuario o por texto de la publicación. */
export function matchesAdminPublicacionesSearch(p: AdminPublicacionRow, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const haystack = [p.titulo, p.categoria, p.descripcion, p.autor_nombre, p.autor_apellido, p.autor_email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.indexOf(t) !== -1;
}

export function matchesAdminMensajesSearch(m: AdminMensajeRow, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const haystack = [
    m.publicacion_titulo,
    m.remitente_nombre,
    m.remitente_apellido,
    m.destinatario_nombre,
    m.destinatario_apellido,
    m.cuerpo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.indexOf(t) !== -1;
}
