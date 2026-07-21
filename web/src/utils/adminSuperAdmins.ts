import type { AdminMiembroRow } from "../lib/database.types";
import { capitalizarNombre } from "./format";

/**
 * Buscador de miembros para agregar como súper admin — mismo patrón que el
 * autocompletar de ubicación: se filtra en el cliente sobre la lista de
 * miembros ya cargada, sin query aparte.
 */
export function filtrarCandidatosSuperAdmin(members: AdminMiembroRow[], term: string): AdminMiembroRow[] {
  const t = term.trim().toLowerCase();
  if (!t) return members;
  return members.filter((m) => {
    const texto = `${capitalizarNombre(m.nombre)} ${capitalizarNombre(m.apellido)} ${m.email}`.toLowerCase();
    return texto.indexOf(t) !== -1;
  });
}
