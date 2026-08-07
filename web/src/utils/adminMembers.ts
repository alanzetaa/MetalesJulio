import type {
  AdminDenunciaRow,
  AdminMensajeRow,
  AdminMiembroRow,
  AdminPublicacionRow,
} from "../lib/database.types";

export type AdminSortColumn =
  | "nombre"
  | "dni"
  | "email"
  | "ubicacion"
  | "ciudad"
  | "created_at"
  | "ultima_conexion"
  | "suspendido_hasta"
  | "mensajes_recibidos"
  | "terminos_version_aceptada";

export type SortDirection = "asc" | "desc";

export function matchesAdminSearch(m: AdminMiembroRow, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const haystack = [m.nombre, m.apellido, m.dni, m.email, m.ubicacion, m.ciudad].filter(Boolean).join(" ").toLowerCase();
  return haystack.indexOf(t) !== -1;
}

const DATE_COLUMNS: readonly AdminSortColumn[] = ["created_at", "ultima_conexion", "suspendido_hasta"];
const NUMERIC_COLUMNS: readonly AdminSortColumn[] = ["mensajes_recibidos", "terminos_version_aceptada"];

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

export type AdminPublicacionSortColumn = "created_at" | "autor_nombre" | "categoria" | "tipo" | "titulo";

export function comparePublicacionRows(
  a: AdminPublicacionRow,
  b: AdminPublicacionRow,
  column: AdminPublicacionSortColumn,
  direction: SortDirection
): number {
  let result: number;
  if (column === "created_at") {
    result = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  } else if (column === "autor_nombre") {
    const av = `${a.autor_nombre} ${a.autor_apellido}`.toLowerCase();
    const bv = `${b.autor_nombre} ${b.autor_apellido}`.toLowerCase();
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
  const haystack = [p.titulo, p.categoria, p.descripcion, p.autor_nombre, p.autor_apellido, p.autor_email, p.autor_dni]
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

export function matchesAdminDenunciasSearch(d: AdminDenunciaRow, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  const haystack = [
    d.publicacion_titulo,
    d.denunciante_nombre,
    d.denunciante_apellido,
    d.denunciante_dni,
    d.denunciado_nombre,
    d.denunciado_apellido,
    d.denunciado_dni,
    d.motivo,
    d.comentario,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.indexOf(t) !== -1;
}
