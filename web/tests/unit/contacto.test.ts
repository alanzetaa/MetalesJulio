import { describe, expect, it } from "vitest";
import { buildContactLinks } from "../../src/utils/contacto";

describe("buildContactLinks", () => {
  it("devuelve vacío si no hay ningún dato de contacto", () => {
    expect(buildContactLinks({ whatsapp: null, instagram: null, contacto_email: null })).toEqual([]);
  });

  it("arma el link de whatsapp con wa.me", () => {
    const links = buildContactLinks({ whatsapp: "5491122334455", instagram: null, contacto_email: null });
    expect(links).toEqual([
      { medio: "whatsapp", label: "WhatsApp", url: "https://wa.me/5491122334455", className: "btn btn-dark" },
    ]);
  });

  it("le saca el @ al instagram", () => {
    const links = buildContactLinks({ whatsapp: null, instagram: "@mi.taller", contacto_email: null });
    expect(links[0].url).toBe("https://instagram.com/mi.taller");
  });

  it("arma el link de email con mailto", () => {
    const links = buildContactLinks({ whatsapp: null, instagram: null, contacto_email: "hola@taller.com" });
    expect(links[0].url).toBe("mailto:hola%40taller.com");
  });

  it("devuelve los tres en orden whatsapp, instagram, email", () => {
    const links = buildContactLinks({
      whatsapp: "54911",
      instagram: "taller",
      contacto_email: "hola@taller.com",
    });
    expect(links.map((l) => l.medio)).toEqual(["whatsapp", "instagram", "email"]);
  });
});
