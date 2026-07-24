export interface StatTile {
  valor: number;
  etiqueta: string;
  color: string;
}

/**
 * Minutos de tolerancia para considerar a alguien "en línea ahora" -- un
 * poco más que los 60s del latido de useHeartbeat, para no perder a nadie
 * por una demora de red puntual. Ver reglas.md ("En línea ahora").
 */
export const MINUTOS_EN_LINEA = 3;

export function contarEnLineaAhora(
  members: { ultima_actividad: string | null }[],
  ahora: Date = new Date()
): number {
  const limite = ahora.getTime() - MINUTOS_EN_LINEA * 60 * 1000;
  return members.filter((m) => m.ultima_actividad && new Date(m.ultima_actividad).getTime() >= limite).length;
}

export function buildStatsTiles(params: {
  enLineaAhora: number;
  totalMiembros: number;
  nuevosSemana: number;
  suspendidos: number;
  totalMensajes: number;
  contactosSemana: number;
}): StatTile[] {
  return [
    { valor: params.enLineaAhora, etiqueta: "En línea ahora", color: "#16a34a" },
    { valor: params.totalMiembros, etiqueta: "Miembros totales", color: "#b3986a" },
    { valor: params.nuevosSemana, etiqueta: "Nuevos (últimos 7 días)", color: "#2a9d8f" },
    { valor: params.suspendidos, etiqueta: "Suspendidos", color: "#e07a5f" },
    { valor: params.totalMensajes, etiqueta: "Mensajes totales", color: "#9d4edd" },
    { valor: params.contactosSemana, etiqueta: "Contactos (últimos 7 días)", color: "#4895ef" },
  ];
}
