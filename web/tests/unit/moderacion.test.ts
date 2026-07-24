import { describe, expect, it } from "vitest";
import { contieneInsulto } from "../../src/utils/moderacion";

describe("contieneInsulto", () => {
  it("detecta una palabra prohibida en español", () => {
    expect(contieneInsulto("sos un boludo")).toBe(true);
  });

  it("detecta la palabra sin importar acentos ni mayúsculas", () => {
    expect(contieneInsulto("Sos un ESTÚPIDO")).toBe(true);
  });

  it("detecta una palabra prohibida en inglés", () => {
    expect(contieneInsulto("you are an asshole")).toBe(true);
  });

  it("no marca un texto normal", () => {
    expect(contieneInsulto("Rejas de hierro a medida, muy prolijas")).toBe(false);
  });

  it("no matchea substrings dentro de palabras legítimas", () => {
    // "gil" no debería matchear dentro de "agilidad" o "frágil"
    expect(contieneInsulto("Trabajo con mucha agilidad y frágil cuidado")).toBe(false);
  });

  it("devuelve false para texto vacío o nulo", () => {
    expect(contieneInsulto("")).toBe(false);
    expect(contieneInsulto(null)).toBe(false);
    expect(contieneInsulto(undefined)).toBe(false);
  });
});
