import type { StatsPorDiaRow } from "../lib/database.types";

export interface DiaDelRango {
  iso: string;
  fecha: Date;
  diasAtras: number;
  cantidad: number;
}

/**
 * Relleno de días en cero para que un gráfico de "por día" no se vea vacío
 * con pocos datos — reutilizado por los gráficos de altas/mensajes/contactos
 * de HQ Metales.
 */
export function construirRangoDias(porDiaArray: StatsPorDiaRow[] | null | undefined, dias: number): DiaDelRango[] {
  const mapa: Record<string, number> = {};
  (porDiaArray ?? []).forEach((d) => {
    mapa[d.dia] = Number(d.cantidad) || 0;
  });

  // Importante: "hoy" se calcula en UTC (Date.UTC), no con setHours() en
  // hora local -- setHours() fija la medianoche local, pero toISOString()
  // siempre lee en UTC, así que en un huso horario detrás de UTC (como
  // Argentina, UTC-3) las últimas ~3 horas de cada día calculaban mal el
  // "iso" de hoy (quedaba un día adelantado), y esa fila no encontraba
  // match contra los datos reales de la base. Con Date.UTC no hay ese
  // desfasaje, sin importar la hora local en la que se abra la página.
  const resultado: DiaDelRango[] = [];
  const ahora = new Date();
  const hoyUTC = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate());

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoyUTC - i * 24 * 60 * 60 * 1000);
    const iso = fecha.toISOString().slice(0, 10);
    resultado.push({ iso, fecha, diasAtras: i, cantidad: mapa[iso] ?? 0 });
  }

  return resultado;
}
