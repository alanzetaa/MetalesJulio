export function capitalizarNombre(str: string | null | undefined): string {
  return String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/(^|\s|-)([a-zá-ú])/g, (_, sep: string, letra: string) => sep + letra.toUpperCase());
}

/**
 * Solo pone en mayúscula la primera letra de un título/descripción/mensaje
 * (a diferencia de capitalizarNombre, que pone cada palabra en mayúscula y
 * es solo para nombres propios) -- el resto del texto queda tal cual lo
 * escribió la persona, sin tocarle mayúsculas/minúsculas intencionales.
 */
export function capitalizarOracion(str: string | null | undefined): string {
  const s = String(str ?? "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
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

export function formatHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
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

/**
 * Nombre completo + DNI entre paréntesis para las tablas de HQ Metales (ej.
 * "Juan Pérez (30123456)") -- el DNI va como identificador único al lado del
 * nombre, para no confundir a dos personas con nombre parecido.
 *
 * Si el DNI no viene (por ejemplo, porque la base todavía tiene una versión
 * vieja de la función admin_listar_* que no lo devuelve), se muestra "—" en
 * vez de la palabra "undefined" -- ya pasó una vez y quedaba feo en pantalla.
 */
export function formatNombreConDni(
  nombre: string | null | undefined,
  apellido: string | null | undefined,
  dni: string | null | undefined
): string {
  const completo = `${capitalizarNombre(nombre)} ${capitalizarNombre(apellido)}`.trim();
  return `${completo} (${dni ? dni : "—"})`;
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
