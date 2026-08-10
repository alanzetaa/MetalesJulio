import { describe, expect, it } from "vitest";
import { extraerCiudad, formatCiudadSugerencia, formatUbicacionSugerencia } from "../../src/utils/ubicacion";

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

describe("extraerCiudad / formatCiudadSugerencia", () => {
  it("normaliza siempre a 'Ciudad Autónoma de Buenos Aires' en CABA, aunque Nominatim devuelva 'Buenos Aires' como ciudad", () => {
    const resultado = {
      display_name: "x",
      address: { city: "Buenos Aires", state: "Ciudad Autónoma de Buenos Aires" },
    };
    expect(extraerCiudad(resultado)).toBe("Ciudad Autónoma de Buenos Aires");
    expect(formatCiudadSugerencia(resultado)).toBe("Ciudad Autónoma de Buenos Aires");
  });

  it("en otras provincias, usa la ciudad tal cual la devuelve Nominatim", () => {
    const resultado = { display_name: "x", address: { city: "Mendoza", state: "Mendoza" } };
    expect(extraerCiudad(resultado)).toBe("Mendoza");
    expect(formatCiudadSugerencia(resultado)).toBe("Mendoza");
  });

  it("junta ciudad y provincia cuando son distintas", () => {
    const resultado = { display_name: "x", address: { city: "Isidro Casanova", state: "Buenos Aires" } };
    expect(formatCiudadSugerencia(resultado)).toBe("Isidro Casanova, Buenos Aires");
  });
});
