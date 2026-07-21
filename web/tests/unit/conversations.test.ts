import { describe, expect, it } from "vitest";
import { agruparConversaciones } from "../../src/utils/conversations";
import type { MensajeDetalleRow } from "../../src/lib/database.types";

const YO = "user-alan";
const RAFA = "user-rafa";
const SOFIA = "user-sofia";

function msg(overrides: Partial<MensajeDetalleRow>): MensajeDetalleRow {
  return {
    id: "m1",
    publicacion_id: "pub-1",
    remitente_id: RAFA,
    destinatario_id: YO,
    cuerpo: "hola",
    created_at: "2026-07-07T10:00:00Z",
    leido_at: null,
    publicacion_titulo: "Rejas de hierro",
    remitente_nombre: "rafa",
    remitente_apellido: "levin",
    destinatario_nombre: "alan",
    destinatario_apellido: "z",
    ...overrides,
  };
}

describe("agruparConversaciones", () => {
  it("agrupa mensajes de la misma publicación y misma contraparte en un solo hilo", () => {
    const rows = [
      msg({ id: "1", created_at: "2026-07-07T10:00:00Z" }),
      msg({ id: "2", created_at: "2026-07-07T10:05:00Z", remitente_id: YO, destinatario_id: RAFA }),
    ];
    const conversaciones = agruparConversaciones(rows, YO);
    expect(conversaciones).toHaveLength(1);
    expect(conversaciones[0].otraId).toBe(RAFA);
  });

  it("separa conversaciones distintas por publicación aunque sea la misma otra persona", () => {
    const rows = [
      msg({ id: "1", publicacion_id: "pub-1" }),
      msg({ id: "2", publicacion_id: "pub-2" }),
    ];
    expect(agruparConversaciones(rows, YO)).toHaveLength(2);
  });

  it("separa conversaciones distintas por contraparte aunque sea la misma publicación", () => {
    const rows = [
      msg({ id: "1", remitente_id: RAFA }),
      msg({ id: "2", remitente_id: SOFIA, remitente_nombre: "sofia", remitente_apellido: "rosemberg" }),
    ];
    expect(agruparConversaciones(rows, YO)).toHaveLength(2);
  });

  it("toma el mensaje más reciente como último mensaje, sin importar el orden de entrada", () => {
    const rows = [
      msg({ id: "viejo", created_at: "2026-07-01T10:00:00Z", cuerpo: "primero" }),
      msg({ id: "nuevo", created_at: "2026-07-07T10:00:00Z", cuerpo: "más reciente" }),
    ];
    expect(agruparConversaciones(rows, YO)[0].ultimoMensaje.cuerpo).toBe("más reciente");
  });

  it("cuenta solo los mensajes no leídos que YO recibí", () => {
    const rows = [
      msg({ id: "1", leido_at: null }),
      msg({ id: "2", leido_at: null }),
      msg({ id: "3", remitente_id: YO, destinatario_id: RAFA, leido_at: null }),
    ];
    expect(agruparConversaciones(rows, YO)[0].noLeidos).toBe(2);
  });

  it("ordena las conversaciones por fecha del último mensaje, más reciente primero", () => {
    const rows = [
      msg({ id: "a", publicacion_id: "pub-vieja", created_at: "2026-07-01T10:00:00Z" }),
      msg({ id: "b", publicacion_id: "pub-nueva", created_at: "2026-07-07T10:00:00Z" }),
    ];
    const conversaciones = agruparConversaciones(rows, YO);
    expect(conversaciones[0].publicacionId).toBe("pub-nueva");
    expect(conversaciones[1].publicacionId).toBe("pub-vieja");
  });

  it("arma el nombre de la contraparte con Capitalización, tomando el otro lado según quién soy yo", () => {
    const rows = [msg({ remitente_id: RAFA, destinatario_id: YO })];
    expect(agruparConversaciones(rows, YO)[0].otraNombre).toBe("Rafa Levin");
  });
});
