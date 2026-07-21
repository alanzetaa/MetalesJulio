import { construirRangoDias } from "./dateRange";
import { CATEGORY_COLORS } from "../constants/categories";
import type { StatsCategoriaRow, StatsPorDiaRow } from "../lib/database.types";

export interface ChartBarItem {
  label: string;
  value: number;
  color?: string;
  tooltip?: string;
}

export function categoriaChartItems(data: StatsCategoriaRow[]): ChartBarItem[] {
  return data.map((d) => ({
    label: d.categoria,
    value: Number(d.cantidad) || 0,
    color: CATEGORY_COLORS[d.categoria] ?? "var(--color-accent)",
  }));
}

/** Últimos 30 días rellenados en cero, con etiqueta cada 6 días para no amontonar texto. */
export function porDiaChartItems(data: StatsPorDiaRow[], color: string): ChartBarItem[] {
  return construirRangoDias(data, 30).map((d) => {
    const mostrarEtiqueta = d.diasAtras % 6 === 0;
    return {
      label: mostrarEtiqueta ? d.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "",
      tooltip: d.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      value: d.cantidad,
      color,
    };
  });
}

export function totalCantidad(data: { cantidad: number }[]): number {
  return data.reduce((sum, d) => sum + (Number(d.cantidad) || 0), 0);
}
