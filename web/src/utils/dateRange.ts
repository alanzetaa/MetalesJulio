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

  const resultado: DiaDelRango[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoy.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = fecha.toISOString().slice(0, 10);
    resultado.push({ iso, fecha, diasAtras: i, cantidad: mapa[iso] ?? 0 });
  }

  return resultado;
}
