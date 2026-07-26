export function capitalizarNombre(str: string | null | undefined): string {
  return String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/(^|\s|-)([a-zá-ú])/g, (_, sep: string, letra: string) => sep + letra.toUpperCase());
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/**
 * Nombre + inicial del apellido para mostrarle a OTROS miembros (ej. "Juan
 * Pérez" -> "Juan P.") -- privacidad: no se expone el apellido completo en
 * ningún lugar donde un tercero vea el nombre de otra persona (cards de
 * publicaciones, mini perfil público, mensajería). El apellido completo
 * solo se ve en "Mi perfil" (uno mismo) y en HQ Metales (admin).
 */
export function formatNombrePublico(nombre: string | null | undefined, apellido: string | null | undefined): string {
  const nombreCap = capitalizarNombre(nombre);
  const inicialApellido = capitalizarNombre(apellido).charAt(0);
  return inicialApellido ? `${nombreCap} ${inicialApellido}.` : nombreCap;
}

/** Iniciales para el avatar circular de la mensajería (ej. "Juan Pérez" -> "JP"). */
export function iniciales(nombreCompleto: string | null | undefined): string {
  const partes = String(nombreCompleto ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}
