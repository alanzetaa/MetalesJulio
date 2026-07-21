export interface StatTile {
  valor: number;
  etiqueta: string;
  color: string;
}

export function buildStatsTiles(params: {
  totalMiembros: number;
  nuevosSemana: number;
  suspendidos: number;
  totalMensajes: number;
  contactosSemana: number;
}): StatTile[] {
  return [
    { valor: params.totalMiembros, etiqueta: "Miembros totales", color: "#b3986a" },
    { valor: params.nuevosSemana, etiqueta: "Nuevos (últimos 7 días)", color: "#2a9d8f" },
    { valor: params.suspendidos, etiqueta: "Suspendidos", color: "#e07a5f" },
    { valor: params.totalMensajes, etiqueta: "Mensajes totales", color: "#9d4edd" },
    { valor: params.contactosSemana, etiqueta: "Contactos (últimos 7 días)", color: "#4895ef" },
  ];
}
