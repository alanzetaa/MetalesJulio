export interface StatTile {
  valor: number;
  etiqueta: string;
  color: string;
  onClick?: () => void;
}

/**
 * Minutos de tolerancia para considerar a alguien "en línea ahora" -- un
 * poco más que los 60s del latido de useHeartbeat, para no perder a nadie
 * por una demora de red puntual. Ver reglas.md ("En línea ahora").
 */
export const MINUTOS_EN_LINEA = 3;

export function estaEnLinea(member: { ultima_actividad: string | null }, ahora: Date = new Date()): boolean {
  const limite = ahora.getTime() - MINUTOS_EN_LINEA * 60 * 1000;
  return Boolean(member.ultima_actividad && new Date(member.ultima_actividad).getTime() >= limite);
}

export function contarEnLineaAhora(
  members: { ultima_actividad: string | null }[],
  ahora: Date = new Date()
): number {
  return members.filter((m) => estaEnLinea(m, ahora)).length;
}

export function buildStatsTiles(params: {
  enLineaAhora: number;
  totalMiembros: number;
  aceptaronTerminos: number;
  nuevosSemana: number;
  suspendidos: number;
  totalMensajes: number;
}): StatTile[] {
  return [
    { valor: params.enLineaAhora, etiqueta: "En línea ahora", color: "#16a34a" },
    { valor: params.totalMiembros, etiqueta: "Miembros totales", color: "#b3986a" },
    { valor: params.aceptaronTerminos, etiqueta: "Aceptaron los Términos vigentes", color: "#3a86ff" },
    { valor: params.nuevosSemana, etiqueta: "Nuevos (últimos 7 días)", color: "#2a9d8f" },
    { valor: params.suspendidos, etiqueta: "Suspendidos", color: "#e07a5f" },
    { valor: params.totalMensajes, etiqueta: "Mensajes totales", color: "#9d4edd" },
  ];
}
