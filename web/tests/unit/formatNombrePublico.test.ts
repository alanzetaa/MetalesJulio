import { describe, expect, it } from "vitest";
import { formatNombrePublico } from "../../src/utils/format";

describe("formatNombrePublico", () => {
  it("muestra el nombre completo y solo la inicial del apellido", () => {
    expect(formatNombrePublico("sofia", "rosemberg")).toBe("Sofia R.");
  });

  it("capitaliza ambos igual que capitalizarNombre", () => {
    expect(formatNombrePublico("JUAN CARLOS", "pérez")).toBe("Juan Carlos P.");
  });

  it("devuelve solo el nombre si no hay apellido", () => {
    expect(formatNombrePublico("Ana", null)).toBe("Ana");
    expect(formatNombrePublico("Ana", "")).toBe("Ana");
  });
});
