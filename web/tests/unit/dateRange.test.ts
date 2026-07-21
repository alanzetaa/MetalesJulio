import { describe, expect, it } from "vitest";
import { construirRangoDias } from "../../src/utils/dateRange";

describe("construirRangoDias", () => {
  it("devuelve exactamente la cantidad de días pedida", () => {
    expect(construirRangoDias([], 30)).toHaveLength(30);
    expect(construirRangoDias([], 7)).toHaveLength(7);
  });

  it("rellena en cero los días sin datos", () => {
    const rango = construirRangoDias([], 5);
    expect(rango.every((d) => d.cantidad === 0)).toBe(true);
  });

  it("el último día del rango es hoy (diasAtras 0)", () => {
    const rango = construirRangoDias([], 3);
    const hoyIso = new Date().toISOString().slice(0, 10);
    expect(rango[rango.length - 1].diasAtras).toBe(0);
    expect(rango[rango.length - 1].iso).toBe(hoyIso);
  });

  it("ubica el dato real en el día correcto por iso", () => {
    const hoyIso = new Date().toISOString().slice(0, 10);
    const rango = construirRangoDias([{ dia: hoyIso, cantidad: 4 }], 3);
    const hoyEntry = rango.find((d) => d.iso === hoyIso);
    expect(hoyEntry?.cantidad).toBe(4);
  });

  it("ordena de más viejo a más nuevo", () => {
    const rango = construirRangoDias([], 4);
    for (let i = 1; i < rango.length; i++) {
      expect(rango[i].fecha.getTime()).toBeGreaterThan(rango[i - 1].fecha.getTime());
    }
  });
});
