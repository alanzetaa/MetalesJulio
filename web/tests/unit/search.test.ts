import { describe, expect, it } from "vitest";
import { matchesFilters } from "../../src/utils/search";
import type { TipoPublicacion } from "../../src/lib/database.types";

const pulsera = {
  titulo: "Pulsera plata grabada",
  descripcion: "Trabajo a pedido",
  categoria: "Joyería y bijouterie",
  nombre: "Sofia",
  apellido: "Rosemberg",
  provincia: "CABA",
  ciudad: "Ciudad Autónoma de Buenos Aires, CABA",
  tipo: "ofrezco" as TipoPublicacion,
};

const tipos = (...t: TipoPublicacion[]) => new Set<TipoPublicacion>(t);

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

  it("busca también por ciudad", () => {
    expect(matchesFilters(pulsera, "buenos aires", "")).toBe(true);
  });
});

describe("matchesFilters — botones Ofrezco / Busco", () => {
  const busca = { ...pulsera, tipo: "busco" as TipoPublicacion };

  it("sin ningún botón prendido, deja pasar los dos tipos", () => {
    expect(matchesFilters(pulsera, "", "", tipos())).toBe(true);
    expect(matchesFilters(busca, "", "", tipos())).toBe(true);
  });

  it("con solo 'ofrezco' prendido, deja fuera las de tipo busco", () => {
    expect(matchesFilters(pulsera, "", "", tipos("ofrezco"))).toBe(true);
    expect(matchesFilters(busca, "", "", tipos("ofrezco"))).toBe(false);
  });

  it("con solo 'busco' prendido, deja fuera las de tipo ofrezco", () => {
    expect(matchesFilters(busca, "", "", tipos("busco"))).toBe(true);
    expect(matchesFilters(pulsera, "", "", tipos("busco"))).toBe(false);
  });

  it("con los dos prendidos pasa lo mismo que sin ninguno: se ven todas", () => {
    const ambos = tipos("ofrezco", "busco");
    expect(matchesFilters(pulsera, "", "", ambos)).toBe(true);
    expect(matchesFilters(busca, "", "", ambos)).toBe(true);
  });

  it("el filtro de tipo se combina con el término y el rubro, no los reemplaza", () => {
    expect(matchesFilters(pulsera, "pulsera", "", tipos("ofrezco"))).toBe(true);
    expect(matchesFilters(pulsera, "torno", "", tipos("ofrezco"))).toBe(false);
    expect(matchesFilters(pulsera, "", "Soldadura", tipos("ofrezco"))).toBe(false);
  });
});
