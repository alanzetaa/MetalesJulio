import { describe, expect, it } from "vitest";
import { contarEnLineaAhora } from "../../src/utils/adminStats";

describe("contarEnLineaAhora", () => {
  const ahora = new Date("2026-01-01T12:00:00Z");

  it("cuenta a quienes tuvieron actividad dentro de los últimos 3 minutos", () => {
    const members = [
      { ultima_actividad: "2026-01-01T11:59:00Z" }, // hace 1 min
      { ultima_actividad: "2026-01-01T11:57:30Z" }, // hace 2:30 min
    ];
    expect(contarEnLineaAhora(members, ahora)).toBe(2);
  });

  it("no cuenta a quienes tuvieron su última actividad hace más de 3 minutos", () => {
    const members = [{ ultima_actividad: "2026-01-01T11:50:00Z" }]; // hace 10 min
    expect(contarEnLineaAhora(members, ahora)).toBe(0);
  });

  it("no cuenta a quienes nunca tuvieron actividad (null)", () => {
    expect(contarEnLineaAhora([{ ultima_actividad: null }], ahora)).toBe(0);
  });

  it("devuelve 0 para una lista vacía", () => {
    expect(contarEnLineaAhora([], ahora)).toBe(0);
  });
});
