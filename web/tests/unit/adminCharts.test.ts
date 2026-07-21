import { describe, expect, it } from "vitest";
import { categoriaChartItems, porDiaChartItems, totalCantidad } from "../../src/utils/adminCharts";

describe("categoriaChartItems", () => {
  it("mapea categoría/cantidad a color conocido", () => {
    const items = categoriaChartItems([{ categoria: "Soldadura", cantidad: 5 }]);
    expect(items).toEqual([{ label: "Soldadura", value: 5, color: "#e07a5f" }]);
  });

  it("usa el color de fallback para una categoría desconocida", () => {
    const items = categoriaChartItems([{ categoria: "Rubro inventado", cantidad: 1 }]);
    expect(items[0].color).toBe("var(--color-accent)");
  });
});

describe("porDiaChartItems", () => {
  it("rellena 30 días y sólo pone etiqueta cada 6 días", () => {
    const items = porDiaChartItems([], "#fff");
    expect(items).toHaveLength(30);
    const conEtiqueta = items.filter((i) => i.label !== "");
    expect(conEtiqueta.length).toBeGreaterThan(0);
    expect(items.every((i) => i.color === "#fff")).toBe(true);
  });
});

describe("totalCantidad", () => {
  it("suma la cantidad de cada fila", () => {
    expect(totalCantidad([{ cantidad: 2 }, { cantidad: 3 }])).toBe(5);
  });
  it("devuelve 0 para un array vacío", () => {
    expect(totalCantidad([])).toBe(0);
  });
});
