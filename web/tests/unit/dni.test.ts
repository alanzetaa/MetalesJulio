import { describe, expect, it } from "vitest";
import { esDniSospechoso } from "../../src/utils/dni";

describe("esDniSospechoso", () => {
  it("marca como sospechoso un DNI con todos los dígitos iguales", () => {
    expect(esDniSospechoso("11111111")).toBe(true);
    expect(esDniSospechoso("2222222")).toBe(true);
  });

  it("marca como sospechoso una secuencia correlativa ascendente o descendente", () => {
    expect(esDniSospechoso("12345678")).toBe(true);
    expect(esDniSospechoso("87654321")).toBe(true);
  });

  it("no marca como sospechoso un DNI real", () => {
    expect(esDniSospechoso("32386103")).toBe(false);
    expect(esDniSospechoso("4123098")).toBe(false);
  });

  it("no marca como sospechoso algo que no tiene el formato de DNI (lo valida el regex del schema aparte)", () => {
    expect(esDniSospechoso("abc")).toBe(false);
    expect(esDniSospechoso("123")).toBe(false);
  });
});
