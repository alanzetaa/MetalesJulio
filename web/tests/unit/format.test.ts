import { describe, expect, it } from "vitest";
import { capitalizarNombre, formatFecha, formatFechaCorta, iniciales } from "../../src/utils/format";

describe("capitalizarNombre", () => {
  it("pone en mayúscula la primera letra de cada palabra", () => {
    expect(capitalizarNombre("rafa levin")).toBe("Rafa Levin");
  });

  it("capitaliza también después de un guion", () => {
    expect(capitalizarNombre("maria-jose garcia")).toBe("Maria-Jose Garcia");
  });

  it("respeta acentos y ñ", () => {
    expect(capitalizarNombre("ñandú pérez")).toBe("Ñandú Pérez");
  });

  it("devuelve string vacío para null/undefined", () => {
    expect(capitalizarNombre(null)).toBe("");
    expect(capitalizarNombre(undefined)).toBe("");
  });
});

describe("formatFecha / formatFechaCorta", () => {
  it("devuelve un guion largo para fechas nulas", () => {
    expect(formatFecha(null)).toBe("—");
    expect(formatFechaCorta(undefined)).toBe("—");
  });

  it("formatea una fecha ISO real sin tirar error", () => {
    expect(formatFecha("2026-07-07T12:30:00Z")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatFechaCorta("2026-07-07T12:30:00Z")).toMatch(/\d{2}\/\d{2}\/\d{2}/);
  });
});

describe("iniciales", () => {
  it("toma la primera letra del nombre y del apellido", () => {
    expect(iniciales("Juan Pérez")).toBe("JP");
  });

  it("toma primera y última palabra si hay más de dos", () => {
    expect(iniciales("Maria Jose Lopez")).toBe("ML");
  });

  it("devuelve una sola letra si solo hay una palabra", () => {
    expect(iniciales("Ana")).toBe("A");
  });

  it("devuelve '?' para string vacío, null o undefined", () => {
    expect(iniciales("")).toBe("?");
    expect(iniciales("   ")).toBe("?");
    expect(iniciales(null)).toBe("?");
    expect(iniciales(undefined)).toBe("?");
  });
});
