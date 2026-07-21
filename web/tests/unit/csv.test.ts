import { describe, expect, it, vi } from "vitest";
import { buildCsv, csvEscape, descargarCsv } from "../../src/utils/csv";

describe("csvEscape", () => {
  it("no toca valores simples", () => {
    expect(csvEscape("Rafa")).toBe("Rafa");
    expect(csvEscape(42)).toBe("42");
  });

  it("convierte null/undefined a string vacío", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("entrecomilla y escapa valores con coma, comillas o salto de línea", () => {
    expect(csvEscape("hola, mundo")).toBe('"hola, mundo"');
    expect(csvEscape('dice "hola"')).toBe('"dice ""hola"""');
    expect(csvEscape("linea1\nlinea2")).toBe('"linea1\nlinea2"');
  });
});

describe("buildCsv", () => {
  it("arma headers + filas separados por \\r\\n, con BOM al principio", () => {
    const csv = buildCsv(["Nombre", "Email"], [["Rafa", "rafa@test.com"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Nombre,Email\r\nRafa,rafa@test.com");
  });

  it("funciona con cero filas (solo headers)", () => {
    const csv = buildCsv(["Nombre"], []);
    expect(csv.slice(1)).toBe("Nombre");
  });
});

describe("descargarCsv", () => {
  it("dispara una descarga sin tirar error (smoke test)", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(() => descargarCsv("test.csv", ["A"], [["1"]])).not.toThrow();
    expect(clickSpy).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });
});
