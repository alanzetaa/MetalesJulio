import { describe, expect, it } from "vitest";
import { formatUbicacionSugerencia } from "../../src/utils/ubicacion";

describe("formatUbicacionSugerencia", () => {
  it("arma calle+altura, localidad, provincia", () => {
    const texto = formatUbicacionSugerencia({
      display_name: "Av. Warnes 702, CABA, Argentina",
      address: { road: "Av. Warnes", house_number: "702", city: "Buenos Aires", state: "Ciudad Autónoma de Buenos Aires" },
    });
    expect(texto).toBe("Av. Warnes 702, Buenos Aires, Ciudad Autónoma de Buenos Aires");
  });

  it("omite la provincia si es igual a la localidad", () => {
    const texto = formatUbicacionSugerencia({
      display_name: "x",
      address: { road: "Calle", city: "Córdoba", state: "Córdoba" },
    });
    expect(texto).toBe("Calle, Córdoba");
  });

  it("usa town/village/municipality/suburb como fallback de localidad", () => {
    const texto = formatUbicacionSugerencia({
      display_name: "x",
      address: { suburb: "Palermo", state: "CABA" },
    });
    expect(texto).toBe("Palermo, CABA");
  });

  it("si no hay ninguna parte reconocible, devuelve el display_name completo", () => {
    const texto = formatUbicacionSugerencia({ display_name: "Algún lugar raro", address: {} });
    expect(texto).toBe("Algún lugar raro");
  });
});
