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
