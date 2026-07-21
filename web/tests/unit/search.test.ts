import { describe, expect, it } from "vitest";
import { matchesFilters } from "../../src/utils/search";

const pulsera = {
  titulo: "Pulsera plata grabada",
  descripcion: "Trabajo a pedido",
  categoria: "Joyería y bijouterie",
  nombre: "Sofia",
  apellido: "Rosemberg",
  provincia: "CABA",
};

describe("matchesFilters", () => {
  it("encuentra por una sola palabra que aparece en el título", () => {
    expect(matchesFilters(pulsera, "pulsera", "")).toBe(true);
  });

  it("encuentra con varias palabras en cualquier orden, no solo substring exacto", () => {
    expect(matchesFilters(pulsera, "grabada pulsera", "")).toBe(true);
  });

  it("no encuentra si falta alguna de las palabras pedidas", () => {
    expect(matchesFilters(pulsera, "pulsera oro", "")).toBe(false);
  });

  it("es insensible a mayúsculas/minúsculas", () => {
    expect(matchesFilters(pulsera, "PULSERA", "")).toBe(true);
  });

  it("sin término de búsqueda, matchea igual (deja pasar todo)", () => {
    expect(matchesFilters(pulsera, "", "")).toBe(true);
  });

  it("filtra por categoría activa además del término", () => {
    expect(matchesFilters(pulsera, "", "Joyería y bijouterie")).toBe(true);
    expect(matchesFilters(pulsera, "", "Soldadura")).toBe(false);
  });

  it("busca también por provincia y por nombre del autor", () => {
    expect(matchesFilters(pulsera, "caba", "")).toBe(true);
    expect(matchesFilters(pulsera, "sofia", "")).toBe(true);
  });
});
