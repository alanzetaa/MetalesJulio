import { describe, expect, it } from "vitest";
import { deberiaAvisarPorAumento } from "../../src/utils/notifications";

describe("deberiaAvisarPorAumento", () => {
  it("no avisa en el primer valor conocido (anterior null)", () => {
    expect(deberiaAvisarPorAumento(null, 3)).toBe(false);
  });

  it("avisa cuando el valor sube", () => {
    expect(deberiaAvisarPorAumento(1, 2)).toBe(true);
  });

  it("no avisa cuando el valor baja (se marcaron mensajes como leídos)", () => {
    expect(deberiaAvisarPorAumento(3, 1)).toBe(false);
  });

  it("no avisa cuando el valor queda igual", () => {
    expect(deberiaAvisarPorAumento(2, 2)).toBe(false);
  });
});
