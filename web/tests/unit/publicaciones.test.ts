import { describe, expect, it } from "vitest";
import { fotoExtension, tipoBadgeClass, tipoCardClass, tipoLabel } from "../../src/utils/publicaciones";

describe("tipoLabel", () => {
  it("muestra Busco para tipo busco", () => {
    expect(tipoLabel("busco")).toBe("Busco");
  });
  it("muestra Ofrezco para tipo ofrezco", () => {
    expect(tipoLabel("ofrezco")).toBe("Ofrezco");
  });
});

describe("tipoBadgeClass / tipoCardClass", () => {
  it("devuelve las clases de busco", () => {
    expect(tipoBadgeClass("busco")).toBe("badge-tipo-busco");
    expect(tipoCardClass("busco")).toBe("card-tipo-busco");
  });
  it("devuelve las clases de ofrezco", () => {
    expect(tipoBadgeClass("ofrezco")).toBe("badge-tipo-ofrezco");
    expect(tipoCardClass("ofrezco")).toBe("card-tipo-ofrezco");
  });
});

describe("fotoExtension", () => {
  it("extrae la extensión de un nombre de archivo", () => {
    expect(fotoExtension("foto.jpg")).toBe("jpg");
    expect(fotoExtension("mi.foto.PNG")).toBe("PNG");
  });
  it("devuelve jpg si no hay extensión", () => {
    expect(fotoExtension("sinextension")).toBe("jpg");
  });
});
